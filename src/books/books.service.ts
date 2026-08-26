import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Book, BookStatus } from '../entities/book.entity.js';
import { ReadingSession } from '../entities/reading-session.entity.js';
import { GenresService } from '../genres/genres.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { NotificationsGateway } from '../notifications/notifications.gateway.js';
import { NotificationType } from '../entities/notification.entity.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

export interface ExternalBookResult {
  title: string;
  author: string;
  description?: string;
  coverUrl?: string;
  totalPages?: number;
  isbn?: string;
  publisher?: string;
  publishedYear?: number;
  language?: string;
  externalSourceId?: string;
  externalSource: string;
}

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(ReadingSession)
    private readonly sessionRepo: Repository<ReadingSession>,
    private readonly httpService: HttpService,
    private readonly genresService: GenresService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findAll(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: BookStatus;
      genreId?: string;
    },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.bookRepo
      .createQueryBuilder('book')
      .where('book.userId = :userId', { userId })
      .leftJoinAndSelect('book.genre', 'genre')
      .orderBy('book.createdAt', 'DESC');

    if (query.search) {
      qb.andWhere(
        '(LOWER(book.title) LIKE LOWER(:search) OR LOWER(book.author) LIKE LOWER(:search) OR book.isbn LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.status) {
      qb.andWhere('book.status = :status', { status: query.status });
    }

    if (query.genreId) {
      qb.andWhere('book.genreId = :genreId', { genreId: query.genreId });
    }

    const [books, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data: books,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId: string) {
    const book = await this.bookRepo.findOne({
      where: { id, userId },
      relations: { genre: true, sessions: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return book;
  }

  async create(
    userId: string,
    data: {
      title: string;
      author: string;
      description?: string;
      coverUrl?: string;
      fileUrl?: string;
      totalPages?: number;
      isbn?: string;
      publisher?: string;
      publishedYear?: number;
      language?: string;
      genreId?: string;
      externalSourceId?: string;
      externalSource?: string;
      status?: BookStatus;
    },
  ) {
    if (data.genreId) {
      await this.genresService.findById(data.genreId);
    }

    const book = this.bookRepo.create({
      ...data,
      userId,
      status: data.status || BookStatus.TO_READ,
    });

    const saved = await this.bookRepo.save(book);

    await this.notificationsService.create(
      userId,
      NotificationType.BOOK_ADDED,
      'Book Added',
      `You have added "${saved.title}" to your library.`,
    );

    return { message: 'Book added successfully', data: saved };
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      title: string;
      author: string;
      description: string;
      coverUrl: string;
      fileUrl: string;
      totalPages: number;
      isbn: string;
      publisher: string;
      publishedYear: number;
      language: string;
      genreId: string;
      status: BookStatus;
    }>,
  ) {
    const book = await this.bookRepo.findOne({ where: { id, userId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (data.genreId) {
      await this.genresService.findById(data.genreId);
    }

    Object.assign(book, data);
    const saved = await this.bookRepo.save(book);

    return { message: 'Book updated successfully', data: saved };
  }

  async remove(id: string, userId: string) {
    const book = await this.bookRepo.findOne({ where: { id, userId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.fileUrl) {
      const oldPublicId = book.fileUrl.split('/').pop()?.split('.')[0];
      if (oldPublicId) {
        await this.cloudinaryService.deleteFile(`books/${oldPublicId}`);
      }
    }

    if (book.coverUrl && book.coverUrl.includes('cloudinary')) {
      const oldPublicId = book.coverUrl.split('/').slice(-2).join('/').split('.')[0];
      if (oldPublicId) {
        await this.cloudinaryService.deleteFile(oldPublicId);
      }
    }

    await this.bookRepo.remove(book);

    return { message: 'Book deleted successfully' };
  }

  async updateProgress(
    id: string,
    userId: string,
    currentPage: number,
  ) {
    const book = await this.bookRepo.findOne({ where: { id, userId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    book.lastReadPage = currentPage;

    if (book.status === BookStatus.TO_READ && currentPage > 0) {
      book.status = BookStatus.IN_PROGRESS;
    }

    if (book.totalPages && currentPage >= book.totalPages) {
      book.status = BookStatus.FINISHED;

      await this.notificationsService.create(
        userId,
        NotificationType.BOOK_FINISHED,
        'Book Finished!',
        `Congratulations! You have finished reading "${book.title}".`,
      );

      await this.notificationsGateway.emitReadingProgress(
        userId,
        book.id,
        currentPage,
      );
    }

    const saved = await this.bookRepo.save(book);

    this.notificationsGateway.emitReadingProgress(userId, book.id, currentPage);

    return { message: 'Progress updated', data: saved };
  }

  async externalSearch(query: string) {
    const isIsbn = /^[\d-]{10,17}$/.test(query);

    if (isIsbn) {
      return this.searchByIsbn(query.replace(/-/g, ''));
    }

    const openLibrary$ = this.httpService
      .get(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`)
      .pipe(
        map((res) => this.mapOpenLibraryResults(res.data)),
        catchError(() => of([])),
      );

    const googleBooks$ = this.httpService
      .get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`)
      .pipe(
        map((res) => this.mapGoogleBooksResults(res.data)),
        catchError(() => of([])),
      );

    const [openLibraryResults, googleBooksResults] = await firstValueFrom(
      forkJoin([openLibrary$, googleBooks$]),
    );

    const merged = this.mergeSearchResults(openLibraryResults, googleBooksResults);

    return { data: merged };
  }

  private async searchByIsbn(isbn: string) {
    const openLibrary$ = this.httpService
      .get(`https://openlibrary.org/isbn/${isbn}.json`)
      .pipe(
        map((res) => {
          const d = res.data;
          return [
            {
              title: d.title || 'Unknown',
              author: d.authors?.[0]?.name || 'Unknown',
              description: d.description?.value || d.description || undefined,
              coverUrl: d.covers?.[0]
                ? `https://covers.openlibrary.org/b/id/${d.covers[0]}-L.jpg`
                : undefined,
              totalPages: d.number_of_pages || undefined,
              isbn,
              publisher: d.publishers?.[0]?.name || undefined,
              publishedYear: d.first_publish_date
                ? parseInt(d.first_publish_date)
                : undefined,
              language: d.languages?.[0]?.key?.replace('/languages/', '') || undefined,
              externalSourceId: d.key,
              externalSource: 'open_library',
            },
          ];
        }),
        catchError(() => of([])),
      );

    const googleBooks$ = this.httpService
      .get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`)
      .pipe(
        map((res) => this.mapGoogleBooksResults(res.data)),
        catchError(() => of([])),
      );

    const [olResults, gbResults] = await firstValueFrom(
      forkJoin([openLibrary$, googleBooks$]),
    );

    const merged = this.mergeSearchResults(olResults, gbResults);

    return { data: merged };
  }

  private mapOpenLibraryResults(data: any): ExternalBookResult[] {
    return (data.docs || []).map((doc: any) => ({
      title: doc.title || 'Unknown',
      author: doc.author_name?.[0] || 'Unknown',
      description: undefined,
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        : undefined,
      totalPages: doc.number_of_pages_median || undefined,
      isbn: doc.isbn?.[0] || undefined,
      publisher: doc.publisher?.[0] || undefined,
      publishedYear: doc.first_publish_year || undefined,
      language: doc.language?.[0] || undefined,
      externalSourceId: doc.key,
      externalSource: 'open_library',
    }));
  }

  private mapGoogleBooksResults(data: any): ExternalBookResult[] {
    return (data.items || []).map((item: any) => {
      const vi = item.volumeInfo;
      return {
        title: vi.title || 'Unknown',
        author: vi.authors?.[0] || 'Unknown',
        description: vi.description || undefined,
        coverUrl: vi.imageLinks?.thumbnail || vi.imageLinks?.smallThumbnail || undefined,
        totalPages: vi.pageCount || undefined,
        isbn: vi.industryIdentifiers?.find(
          (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10',
        )?.identifier || undefined,
        publisher: vi.publisher || undefined,
        publishedYear: vi.publishedDate
          ? parseInt(vi.publishedDate)
          : undefined,
        language: vi.language || undefined,
        externalSourceId: item.id,
        externalSource: 'google_books',
      };
    });
  }

  private mergeSearchResults(
    openLibrary: ExternalBookResult[],
    googleBooks: ExternalBookResult[],
  ): ExternalBookResult[] {
    const merged: ExternalBookResult[] = [];
    const seen = new Set<string>();

    for (const book of openLibrary) {
      const key = `${book.title.toLowerCase()}|${book.author.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(book);
      }
    }

    for (const book of googleBooks) {
      const key = `${book.title.toLowerCase()}|${book.author.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(book);
      } else {
        const existing = merged.find(
          (b) =>
            b.title.toLowerCase() === book.title.toLowerCase() &&
            b.author.toLowerCase() === book.author.toLowerCase(),
        );
        if (existing) {
          if (!existing.description && book.description) {
            existing.description = book.description;
          }
          if (!existing.isbn && book.isbn) {
            existing.isbn = book.isbn;
          }
          if (!existing.publisher && book.publisher) {
            existing.publisher = book.publisher;
          }
          if (!existing.coverUrl && book.coverUrl) {
            existing.coverUrl = book.coverUrl;
          }
        }
      }
    }

    return merged;
  }

  async importFromExternal(
    userId: string,
    data: {
      title: string;
      author: string;
      description?: string;
      coverUrl?: string;
      totalPages?: number;
      isbn?: string;
      publisher?: string;
      publishedYear?: number;
      language?: string;
      externalSourceId?: string;
      externalSource?: string;
      genreId?: string;
    },
  ) {
    if (data.genreId) {
      await this.genresService.findById(data.genreId);
    }

    const book = this.bookRepo.create({
      ...data,
      userId,
      status: BookStatus.TO_READ,
    });

    const saved = await this.bookRepo.save(book);

    await this.notificationsService.create(
      userId,
      NotificationType.BOOK_IMPORTED,
      'Book Imported',
      `"${saved.title}" has been imported successfully into your library.`,
    );

    return { message: 'Book imported successfully', data: saved };
  }

  async importByExternalId(
    userId: string,
    externalSourceId: string,
    externalSource: string,
    genreId?: string,
  ) {
    if (genreId) {
      await this.genresService.findById(genreId);
    }

    let bookData: ExternalBookResult;
    let readOnlineUrl: string | null = null;
    let autoFileUrl: string | null = null;

    if (externalSource === 'open_library') {
      const url = `https://openlibrary.org${externalSourceId}.json`;
      const response = await firstValueFrom(this.httpService.get(url));
      const d = response.data;

      const description =
        typeof d.description === 'object'
          ? d.description?.value
          : d.description;

      bookData = {
        title: d.title || 'Unknown',
        author: d.authors?.[0]?.name || 'Unknown',
        description: description || undefined,
        coverUrl: d.covers?.[0]
          ? `https://covers.openlibrary.org/b/id/${d.covers[0]}-L.jpg`
          : undefined,
        totalPages: d.number_of_pages || undefined,
        isbn: d.isbn_13?.[0] || d.isbn_10?.[0] || undefined,
        publisher: d.publishers?.[0]?.name || undefined,
        publishedYear: d.first_publish_date
          ? parseInt(d.first_publish_date)
          : undefined,
        language: d.languages?.[0]?.key?.replace('/languages/', '') || undefined,
        externalSourceId,
        externalSource: 'open_library',
      };

      const iaResult = await this.findInternetArchiveFile(externalSourceId);
      if (iaResult) {
        readOnlineUrl = iaResult.readUrl;
        if (iaResult.pdfUrl) {
          try {
            autoFileUrl = await this.downloadPdfToCloudinary(iaResult.pdfUrl, iaResult.identifier);
          } catch (e) {
            this.logger.warn(`Failed to auto-download PDF: ${e.message}`);
          }
        }
      }
    } else if (externalSource === 'google_books') {
      const response = await firstValueFrom(
        this.httpService.get(`https://www.googleapis.com/books/v1/volumes/${externalSourceId}`),
      );
      const vi = response.data.volumeInfo;

      bookData = {
        title: vi.title || 'Unknown',
        author: vi.authors?.[0] || 'Unknown',
        description: vi.description || undefined,
        coverUrl: vi.imageLinks?.thumbnail || vi.imageLinks?.smallThumbnail || undefined,
        totalPages: vi.pageCount || undefined,
        isbn: vi.industryIdentifiers?.find(
          (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10',
        )?.identifier || undefined,
        publisher: vi.publisher || undefined,
        publishedYear: vi.publishedDate ? parseInt(vi.publishedDate) : undefined,
        language: vi.language || undefined,
        externalSourceId,
        externalSource: 'google_books',
      };

      if (vi.previewLink) {
        readOnlineUrl = vi.previewLink;
      }
    } else {
      throw new NotFoundException('Unknown external source');
    }

    const book = this.bookRepo.create({
      title: bookData.title,
      author: bookData.author,
      description: bookData.description,
      coverUrl: bookData.coverUrl,
      fileUrl: autoFileUrl,
      totalPages: bookData.totalPages,
      isbn: bookData.isbn,
      publisher: bookData.publisher,
      publishedYear: bookData.publishedYear,
      language: bookData.language,
      externalSourceId: bookData.externalSourceId,
      externalSource: bookData.externalSource,
      readOnlineUrl,
      userId,
      status: BookStatus.TO_READ,
      genreId: genreId || null,
    });

    const saved = await this.bookRepo.save(book);

    await this.notificationsService.create(
      userId,
      NotificationType.BOOK_IMPORTED,
      'Book Imported',
      `"${saved.title}" has been imported successfully into your library.`,
    );

    return {
      message: 'Book imported successfully',
      data: {
        ...saved,
        hasReadableContent: !!(autoFileUrl || readOnlineUrl),
      },
    };
  }

  private async findInternetArchiveFile(openLibraryKey: string) {
    try {
      const editionsUrl = `https://openlibrary.org${openLibraryKey}/editions.json`;
      const editionsRes = await firstValueFrom(this.httpService.get(editionsUrl));
      const editions = editionsRes.data.entries || [];

      for (const edition of editions.slice(0, 5)) {
        const ocaid = edition.ocaid;
        if (!ocaid) continue;

        const metaUrl = `https://archive.org/metadata/${ocaid}`;
        const metaRes = await firstValueFrom(
          this.httpService.get(metaUrl).pipe(
            catchError(() => of(null)),
          ),
        );
        if (!metaRes?.data?.files) continue;

        const files = metaRes.data.files;
        const pdfFile = files.find((f: any) =>
          f.name.endsWith('.pdf') && !f.name.includes('_⠮') && !f.name.includes('_djvu'),
        );
        const epubFile = files.find((f: any) => f.name.endsWith('.epub'));

        const bookFile = pdfFile || epubFile;

        if (bookFile) {
          return {
            identifier: ocaid,
            readUrl: `https://archive.org/details/${ocaid}`,
            pdfUrl: `https://archive.org/download/${ocaid}/${bookFile.name}`,
          };
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  private async downloadPdfToCloudinary(url: string, identifier: string): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.get(url, { responseType: 'arraybuffer' }),
    );

    const buffer = Buffer.from(response.data);
    const isPdf = buffer.slice(0, 4).toString() === '%PDF';
    const ext = isPdf ? 'pdf' : 'epub';
    const filename = `${identifier}.${ext}`;

    const file: Express.Multer.File = {
      buffer,
      size: buffer.length,
      mimetype: isPdf ? 'application/pdf' : 'application/epub+zip',
      originalname: filename,
      encoding: '7bit',
      fieldname: 'file',
    } as any;

    const { url: cloudinaryUrl } = await this.cloudinaryService.uploadFile(file, 'books');
    return cloudinaryUrl;
  }

  async getReadingInfo(id: string, userId: string) {
    const book = await this.bookRepo.findOne({
      where: { id, userId },
      relations: { genre: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return {
      data: {
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        fileUrl: book.fileUrl,
        readOnlineUrl: book.readOnlineUrl,
        lastReadPage: book.lastReadPage,
        totalPages: book.totalPages,
        status: book.status,
        hasReadableContent: !!(book.fileUrl || book.readOnlineUrl),
      },
    };
  }

  async uploadBookFile(id: string, userId: string, file: Express.Multer.File) {
    const book = await this.bookRepo.findOne({ where: { id, userId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.fileUrl) {
      const oldPublicId = book.fileUrl.split('/').pop()?.split('.')[0];
      if (oldPublicId) {
        await this.cloudinaryService.deleteFile(`books/${oldPublicId}`);
      }
    }

    const { url } = await this.cloudinaryService.uploadFile(file, 'books');
    book.fileUrl = url;
    const saved = await this.bookRepo.save(book);

    return { message: 'File uploaded successfully', data: saved };
  }

  async uploadBookCover(id: string, userId: string, file: Express.Multer.File) {
    const book = await this.bookRepo.findOne({ where: { id, userId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.coverUrl && book.coverUrl.includes('cloudinary')) {
      const oldPublicId = book.coverUrl.split('/').slice(-2).join('/').split('.')[0];
      if (oldPublicId) {
        await this.cloudinaryService.deleteFile(oldPublicId);
      }
    }

    const { url } = await this.cloudinaryService.uploadImage(file, 'books');
    book.coverUrl = url;
    const saved = await this.bookRepo.save(book);

    return { message: 'Cover uploaded successfully', data: saved };
  }
}
