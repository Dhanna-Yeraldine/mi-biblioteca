/**
 * Interfaz: mensajes al usuario. Toda acción responde (skill forms §3):
 * un toast confirma lo que pasó y un diálogo confirma antes de borrar.
 */

const TOAST_DURATION_MS = 5000;

export class Toast {
  #element = document.querySelector('#toast');
  #message = document.querySelector('#toast-message');
  #action = document.querySelector('#toast-action');
  #timer = null;
  #onAction = null;

  constructor() {
    this.#action.addEventListener('click', () => {
      const callback = this.#onAction;
      this.hide();
      callback?.();
    });
  }

  show(message, { actionLabel, onAction } = {}) {
    clearTimeout(this.#timer);
    this.#message.textContent = message;
    this.#onAction = onAction ?? null;
    this.#action.textContent = actionLabel ?? '';
    this.#action.hidden = !actionLabel;
    this.#element.hidden = false;
    this.#timer = setTimeout(() => this.hide(), TOAST_DURATION_MS);
  }

  hide() {
    clearTimeout(this.#timer);
    this.#element.hidden = true;
    this.#onAction = null;
  }
}

/** Abre el diálogo de confirmación y resuelve true solo si el usuario confirma. */
export function confirmDeletion(bookTitle) {
  const dialog = document.querySelector('#confirm-dialog');
  dialog.querySelector('#confirm-text').textContent =
    `Se quitará «${bookTitle}» de tu biblioteca. Podrás deshacerlo unos segundos después.`;

  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once: true });
    dialog.returnValue = '';
    dialog.showModal();
    // Foco en "Cancelar": la acción destructiva nunca es la opción por defecto.
    dialog.querySelector('button[value="cancel"]').focus();
  });
}
