import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { BooksService } from './books.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';
import { UpdateProgressDto } from './dto/update-progress.dto.js';
import { ImportBookDto } from './dto/import-book.dto.js';
import { ImportByExternalIdDto } from './dto/import-by-external-id.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator.js';
import { BookStatus } from '../entities/book.entity.js';

@ApiTags('Books')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @ApiOperation({ summary: 'List all books with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: BookStatus })
  @ApiQuery({ name: 'genreId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Books listed with pagination' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: BookStatus,
    @Query('genreId') genreId?: string,
  ) {
    return this.booksService.findAll(user.userId, {
      page,
      limit,
      search,
      status,
      genreId,
    });
  }

  @Get('external-search')
  @ApiOperation({
    summary: 'Search books externally (Open Library + Google Books)',
    description:
      'Search by title, author, or ISBN. Results are merged from Open Library and Google Books APIs. ISBN detection is automatic (e.g. 978-2-07-036052-9).',
  })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query (title, author, or ISBN)' })
  @ApiResponse({ status: 200, description: 'Merged external search results' })
  externalSearch(@Query('q') query: string) {
    return this.booksService.externalSearch(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get book details' })
  @ApiResponse({ status: 200, description: 'Book details' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.booksService.findById(id, user.userId);
  }

  @Get(':id/read')
  @ApiOperation({
    summary: 'Get reading info for a book',
    description:
      'Returns fileUrl (Cloudinary PDF), readOnlineUrl (Internet Archive), and lastReadPage. The frontend uses this to know how to display the book reader.',
  })
  @ApiResponse({ status: 200, description: 'Reading info with URLs' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  getReadingInfo(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.booksService.getReadingInfo(id, user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a book manually' })
  @ApiResponse({ status: 201, description: 'Book created successfully' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBookDto,
  ) {
    return this.booksService.create(user.userId, dto);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import a book from external source' })
  @ApiResponse({ status: 201, description: 'Book imported successfully' })
  importBook(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ImportBookDto,
  ) {
    return this.booksService.importFromExternal(user.userId, dto);
  }

  @Post('import-external')
  @ApiOperation({
    summary: 'Import a book by external ID (auto-fetch details)',
    description:
      'Pass the externalSourceId and externalSource from a search result. The backend fetches all details automatically.',
  })
  @ApiResponse({ status: 201, description: 'Book imported successfully' })
  @ApiResponse({ status: 404, description: 'Book not found on external source' })
  importByExternalId(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ImportByExternalIdDto,
  ) {
    return this.booksService.importByExternalId(
      user.userId,
      dto.externalSourceId,
      dto.externalSource,
      dto.genreId,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a book' })
  @ApiResponse({ status: 200, description: 'Book updated' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateBookDto,
  ) {
    return this.booksService.update(id, user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book' })
  @ApiResponse({ status: 200, description: 'Book deleted' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.booksService.remove(id, user.userId);
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: 'Update reading progress' })
  @ApiResponse({ status: 200, description: 'Progress updated' })
  updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.booksService.updateProgress(id, user.userId, dto.currentPage);
  }

  @Post(':id/file')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf',
          'application/epub+zip',
          'application/x-mobipocket-ebook',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only PDF and EPUB files are allowed'), false);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Upload a book file (PDF/EPUB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  uploadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.booksService.uploadBookFile(id, user.userId, file);
  }

  @Post(':id/cover')
  @UseInterceptors(
    FileInterceptor('cover', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          cb(new Error('Only image files are allowed (jpg, png, gif, webp)'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Upload a book cover image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cover: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Cover uploaded successfully' })
  uploadCover(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.booksService.uploadBookCover(id, user.userId, file);
  }
}
