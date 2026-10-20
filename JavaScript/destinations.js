// DESTINATION GALLERY NOTE: clicking a destination photo opens it in a larger modal; Escape or close dismisses it.
document.addEventListener("DOMContentLoaded", () => {
  const galleryImages = document.querySelectorAll(
    ".destination-gallery-grid img",
  );
  const modal = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");
  const closeModal = document.querySelector(".close-modal");

  if (!modal || !modalImage || !closeModal || galleryImages.length === 0)
    return;

  galleryImages.forEach((image) => {
    image.addEventListener("click", () => {
      modalImage.src = image.src;
      modalImage.alt = image.alt || "Destination gallery image";
      modal.style.display = "flex";
      closeModal.focus();
    });
  });

  const close = () => {
    modal.style.display = "none";
  };
  closeModal.addEventListener("click", close);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
});
