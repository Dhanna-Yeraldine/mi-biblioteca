/**
 * Dominio: la entidad Libro y sus reglas de negocio.
 * No depende del navegador, del DOM ni de localStorage, por eso se puede
 * probar con Node sin nada más.
 */

export const READING_STATUS = Object.freeze({
  TO_READ: 'to-read',
  READING: 'reading',
  FINISHED: 'finished',
});

export const STATUS_LABELS = Object.freeze({
  [READING_STATUS.TO_READ]: 'Por leer',
  [READING_STATUS.READING]: 'Leyendo',
  [READING_STATUS.FINISHED]: 'Leído',
});

export const GENRES = Object.freeze([
  'Novela',
  'Cuento',
  'Poesía',
  'Ensayo',
  'Ciencia ficción',
  'Fantasía',
  'Historia',
  'Tecnología',
  'Autoayuda',
  'Otro',
]);

export const TITLE_MAX_LENGTH = 120;
export const AUTHOR_MAX_LENGTH = 80;
export const MIN_RATING = 1;
export const MAX_RATING = 5;

/** Error de validación con un mensaje por campo, listo para mostrar junto a cada input. */
export class ValidationError extends Error {
  constructor(fieldErrors) {
    super('Revisa los campos marcados');
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

/** Deja los textos sin espacios repetidos ni a los lados. */
function cleanText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

/** La calificación es opcional: vacío se guarda como null. */
function parseRating(value) {
  if (value === '' || value === null || value === undefined) return null;
  return Number(value);
}

/**
 * Normaliza los datos que llegan del formulario.
 * Se hace antes de validar para que " Cien  años " y "Cien años" sean lo mismo.
 */
export function normalizeBookData(data) {
  return {
    title: cleanText(data.title),
    author: cleanText(data.author),
    genre: cleanText(data.genre),
    status: cleanText(data.status) || READING_STATUS.TO_READ,
    rating: parseRating(data.rating),
  };
}

/**
 * Valida los datos ya normalizados.
 * Devuelve un objeto { campo: mensaje }; vacío significa que todo está bien.
 */
export function validateBookData(data) {
  const errors = {};

  if (!data.title) {
    errors.title = 'Escribe el título del libro';
  } else if (data.title.length > TITLE_MAX_LENGTH) {
    errors.title = `El título puede tener hasta ${TITLE_MAX_LENGTH} caracteres`;
  }

  if (!data.author) {
    errors.author = 'Escribe el nombre del autor o autora';
  } else if (data.author.length > AUTHOR_MAX_LENGTH) {
    errors.author = `El autor puede tener hasta ${AUTHOR_MAX_LENGTH} caracteres`;
  }

  if (!GENRES.includes(data.genre)) {
    errors.genre = 'Elige un género de la lista';
  }

  if (!Object.values(READING_STATUS).includes(data.status)) {
    errors.status = 'Elige si lo vas a leer, lo estás leyendo o ya lo leíste';
  }

  const ratingIsValid =
    data.rating === null ||
    (Number.isInteger(data.rating) && data.rating >= MIN_RATING && data.rating <= MAX_RATING);
  if (!ratingIsValid) {
    errors.rating = `La calificación va de ${MIN_RATING} a ${MAX_RATING} estrellas`;
  }

  return errors;
}

/** Normaliza y valida; lanza ValidationError si algo está mal. */
function toValidBookData(data) {
  const normalized = normalizeBookData(data);
  const errors = validateBookData(normalized);
  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }
  return normalized;
}

/** Crea un libro nuevo. El id y la fecha se reciben de fuera para poder probarlo. */
export function createBook(data, { id, now }) {
  const valid = toValidBookData(data);
  const timestamp = now.toISOString();
  return Object.freeze({ id, ...valid, createdAt: timestamp, updatedAt: timestamp });
}

/** Devuelve una copia del libro con los cambios; el original no se modifica. */
export function updateBook(book, data, { now }) {
  const valid = toValidBookData(data);
  return Object.freeze({ ...book, ...valid, updatedAt: now.toISOString() });
}
