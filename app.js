// Simple localStorage persistence
let stock = JSON.parse(localStorage.getItem("stock")) || [];

function saveData() {
  localStorage.setItem("stock", JSON.stringify(stock));
}

// Render stock table
function renderStock() {
  const stockTable = document.querySelector("#stockTable tbody");
  stockTable.innerHTML = "";
  stock.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.cost}</td>
      <td>${item.price}</td>
      <td>${item.quantity}</td>
      <td>
        <button onclick="editItem(${index})">✏️ Edit</button>
        <button onclick="deleteItem(${index})">🗑️ Delete</button>
      </td>
    `;
    stockTable.appendChild(row);
  });
}

// Add new item
document.getElementById("itemForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("itemName").value;
  const cost = parseFloat(document.getElementById("itemCost").value);
  const price = parseFloat(document.getElementById("itemPrice").value);
  const qty = parseInt(document.getElementById("itemQty").value);

  stock.push({ name, cost, price, quantity: qty });
  saveData();
  renderStock();

  e.target.reset();
});

// Edit item
function editItem(index) {
  const item = stock[index];
  const newName = prompt("Edit item name:", item.name);
  const newCost = prompt("Edit item cost:", item.cost);
  const newPrice = prompt("Edit item price:", item.price);
  const newQty = prompt("Edit item quantity:", item.quantity);

  if (newName && newCost && newPrice && newQty) {
    stock[index] = {
      name: newName,
      cost: parseFloat(newCost),
      price: parseFloat(newPrice),
      quantity: parseInt(newQty)
    };
    saveData();
    renderStock();
  }
}

// Delete item
function deleteItem(index) {
  if (confirm("Are you sure you want to delete this item?")) {
    stock.splice(index, 1);
    saveData();
    renderStock();
  }
}

// Initial render
renderStock();
