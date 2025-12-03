document.addEventListener("DOMContentLoaded", function () {
  const select = document.getElementById("characterSelect");
  const cards = document.querySelectorAll(".character-card");

  function showCardById(id) {
    cards.forEach((card) => {
      if (card.id === id) {
        card.classList.add("active");
      } else {
        card.classList.remove("active");
      }
    });
  }

  // When dropdown changes, show the matching card
  select.addEventListener("change", function () {
    const value = this.value;
    if (!value) {
      // Hide all if nothing selected
      cards.forEach((card) => card.classList.remove("active"));
      return;
    }
    showCardById(value);
  });

  // Optional: if you want to support links like ?char=wizard or #wizard
  const params = new URLSearchParams(window.location.search);
  const queryChar = params.get("char");
  const hashChar = window.location.hash ? window.location.hash.substring(1) : null;

  const initialId = queryChar || hashChar;

  if (initialId) {
    const option = Array.from(select.options).find((opt) => opt.value === initialId);
    if (option) {
      select.value = initialId;
      showCardById(initialId);
    }
  }
});
