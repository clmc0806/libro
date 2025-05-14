let db;

window.onload = () => {
  const request = indexedDB.open("CantosDB", 1);

  request.onerror = (e) => console.error("Error al abrir DB", e);
  request.onsuccess = (e) => {
    db = e.target.result;
    mostrarCantos();
  };

  request.onupgradeneeded = (e) => {
    db = e.target.result;
    const objectStore = db.createObjectStore("cantos", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("titulo", "titulo", { unique: false });
  };

  document.getElementById("canto-form").onsubmit = agregarCanto;
  document.getElementById("search").oninput = mostrarCantos;
};

function agregarCanto(e) {
  e.preventDefault();

  const titulo = document.getElementById("titulo").value;
  const letra = document.getElementById("letra").value;
  const form = document.getElementById("canto-form");
  const editId = form.getAttribute("data-edit-id");

  const tx = db.transaction("cantos", "readwrite");
  const store = tx.objectStore("cantos");

  if (editId) {
    // Editar canto existente
    store.put({ id: Number(editId), titulo, letra });
    form.removeAttribute("data-edit-id");
  } else {
    // Nuevo canto
    store.add({ titulo, letra });
  }

  tx.oncomplete = () => {
    form.reset();
    mostrarCantos();
    document.getElementById("canto-detalle").innerHTML = "";
  };
}

function mostrarCantos() {
  const lista = document.getElementById("cantos-list");
  const filtro = document.getElementById("search").value.toLowerCase();
  lista.innerHTML = "";

  const tx = db.transaction("cantos", "readonly");
  const store = tx.objectStore("cantos");

  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const { id, titulo } = cursor.value;
      if (!filtro || titulo.toLowerCase().includes(filtro)) {
        const li = document.createElement("li");
        li.textContent = titulo;
        li.onclick = () => mostrarDetalleCanto(cursor.value);
        lista.appendChild(li);
      }
      cursor.continue();
    }
  };
}

function mostrarDetalleCanto(canto) {
  const detalle = document.getElementById("canto-detalle");
  detalle.innerHTML = `
    <h3>${canto.titulo}</h3>
    <pre>${canto.letra}</pre>
    <button onclick="editarCanto(${canto.id})">Editar</button>
  `;
}

function editarCanto(id) {
  const tx = db.transaction("cantos", "readonly");
  const store = tx.objectStore("cantos");
  const request = store.get(id);

  request.onsuccess = () => {
    const canto = request.result;
    document.getElementById("titulo").value = canto.titulo;
    document.getElementById("letra").value = canto.letra;

    // Guardar el ID que se está editando
    document.getElementById("canto-form").setAttribute("data-edit-id", id);
  };
}
