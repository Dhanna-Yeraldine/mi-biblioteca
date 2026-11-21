import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { BookService, BookNotFoundError } from '../src/application/book-service.js';
import { LocalStorageBookRepository } from '../src/infrastructure/local-storage-book-repository.js';
import { ValidationError, READING_STATUS } from '../src/domain/book.js';

/** localStorage falso: misma interfaz, guardado en memoria. */
class MemoryStorage {
  #items = new Map();
  getItem(key) {
    return this.#items.has(key) ? this.#items.get(key) : null;
  }
  setItem(key, value) {
    this.#items.set(key, String(value));
  }
}

const book = (overrides = {}) => ({
  title: 'El túnel',
  author: 'Ernesto Sabato',
  genre: 'Novela',
  status: READING_STATUS.TO_READ,
  rating: '',
  ...overrides,
});

let service;
let storage;

beforeEach(() => {
  let nextId = 0;
  let minutes = 0;
  storage = new MemoryStorage();
  service = new BookService({
    repository: new LocalStorageBookRepository(storage),
    generateId: () => `id-${++nextId}`,
    clock: () => new Date(Date.UTC(2026, 10, 20, 10, minutes++)),
  });
});

test('should_add_book_and_persist_it', () => {
  const created = service.addBook(book());

  assert.equal(created.id, 'id-1');
  assert.deepEqual(service.getBook('id-1'), created);
  assert.equal(JSON.parse(storage.getItem('mi-biblioteca:books')).length, 1);
});

test('should_not_persist_invalid_book', () => {
  assert.throws(() => service.addBook(book({ title: '' })), ValidationError);
  assert.equal(service.listBooks().length, 0);
});

test('should_list_newest_first', () => {
  service.addBook(book({ title: 'Primero' }));
  service.addBook(book({ title: 'Segundo' }));

  assert.deepEqual(service.listBooks().map((b) => b.title), ['Segundo', 'Primero']);
});

test('should_search_by_title_or_author_ignoring_accents_and_case', () => {
  service.addBook(book({ title: 'María', author: 'Jorge Isaacs' }));
  service.addBook(book({ title: 'Rayuela', author: 'Julio Cortázar' }));

  assert.deepEqual(service.listBooks({ search: 'maria' }).map((b) => b.title), ['María']);
  assert.deepEqual(service.listBooks({ search: 'CORTAZAR' }).map((b) => b.title), ['Rayuela']);
});

test('should_filter_by_status', () => {
  service.addBook(book({ title: 'A', status: READING_STATUS.READING }));
  service.addBook(book({ title: 'B', status: READING_STATUS.FINISHED }));

  assert.deepEqual(
    service.listBooks({ status: READING_STATUS.READING }).map((b) => b.title),
    ['A'],
  );
});

test('should_edit_existing_book', () => {
  const { id } = service.addBook(book());

  service.editBook(id, book({ status: READING_STATUS.FINISHED, rating: '4' }));

  const saved = service.getBook(id);
  assert.equal(saved.status, READING_STATUS.FINISHED);
  assert.equal(saved.rating, 4);
  assert.equal(service.listBooks().length, 1, 'editar no duplica');
});

test('should_fail_when_editing_missing_book', () => {
  assert.throws(() => service.editBook('nope', book()), BookNotFoundError);
});

test('should_remove_book_and_restore_it', () => {
  const { id } = service.addBook(book());

  const removed = service.removeBook(id);
  assert.equal(service.listBooks().length, 0);

  service.restoreBook(removed);
  assert.deepEqual(service.getBook(id), removed);
});

test('should_fail_when_removing_missing_book', () => {
  assert.throws(() => service.removeBook('nope'), BookNotFoundError);
});

test('should_start_empty_when_stored_data_is_corrupt', (t) => {
  t.mock.method(console, 'warn', () => {});
  storage.setItem('mi-biblioteca:books', '{no es json');

  assert.deepEqual(service.listBooks(), []);
});
