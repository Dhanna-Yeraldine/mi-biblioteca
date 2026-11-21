import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createBook,
  updateBook,
  normalizeBookData,
  validateBookData,
  ValidationError,
  READING_STATUS,
} from '../src/domain/book.js';

const NOW = new Date('2026-11-20T10:00:00.000Z');
const validData = {
  title: 'Cien años de soledad',
  author: 'Gabriel García Márquez',
  genre: 'Novela',
  status: READING_STATUS.FINISHED,
  rating: '5',
};

test('should_create_book_with_id_dates_and_numeric_rating', () => {
  const book = createBook(validData, { id: 'b1', now: NOW });

  assert.equal(book.id, 'b1');
  assert.equal(book.rating, 5);
  assert.equal(book.createdAt, NOW.toISOString());
  assert.equal(book.updatedAt, NOW.toISOString());
  assert.ok(Object.isFrozen(book));
});

test('should_trim_and_collapse_spaces_in_texts', () => {
  const data = normalizeBookData({ ...validData, title: '  Cien   años  ', author: ' Gabo ' });

  assert.equal(data.title, 'Cien años');
  assert.equal(data.author, 'Gabo');
});

test('should_store_empty_rating_as_null', () => {
  const book = createBook({ ...validData, rating: '' }, { id: 'b1', now: NOW });
  assert.equal(book.rating, null);
});

test('should_default_status_to_to_read', () => {
  assert.equal(normalizeBookData({ ...validData, status: '' }).status, READING_STATUS.TO_READ);
});

test('should_report_one_message_per_invalid_field', () => {
  const errors = validateBookData(
    normalizeBookData({ title: '', author: '   ', genre: 'Cocina', status: 'lost', rating: '9' }),
  );

  assert.deepEqual(Object.keys(errors).sort(), ['author', 'genre', 'rating', 'status', 'title']);
});

test('should_reject_titles_longer_than_limit', () => {
  const errors = validateBookData(normalizeBookData({ ...validData, title: 'a'.repeat(121) }));
  assert.ok(errors.title);
});

test('should_reject_decimal_rating', () => {
  const errors = validateBookData(normalizeBookData({ ...validData, rating: '3.5' }));
  assert.ok(errors.rating);
});

test('should_throw_validation_error_with_field_errors_on_create', () => {
  assert.throws(
    () => createBook({ ...validData, title: '' }, { id: 'b1', now: NOW }),
    (error) => error instanceof ValidationError && 'title' in error.fieldErrors,
  );
});

test('should_update_fields_and_keep_id_and_creation_date', () => {
  const original = createBook(validData, { id: 'b1', now: NOW });
  const later = new Date('2026-11-21T10:00:00.000Z');

  const updated = updateBook(original, { ...validData, status: READING_STATUS.READING }, { now: later });

  assert.equal(updated.id, 'b1');
  assert.equal(updated.status, READING_STATUS.READING);
  assert.equal(updated.createdAt, NOW.toISOString());
  assert.equal(updated.updatedAt, later.toISOString());
  assert.equal(original.status, READING_STATUS.FINISHED, 'el original no cambia');
});
