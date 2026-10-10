const GST_RATE = 0.05;

const API_URL = "http://localhost:5000/api";

let currentUser = null;
let products = [];
let bills = JSON.parse(localStorage.getItem("grocery_bills")) || [];
let currentBill = [];


async function loadProducts() {
    const response = await fetch(`${API_URL}/products`);

    if (!response.ok) {
        throw new Error("Failed to load products");
    }

    products = await response.json();

    updateDashboard();
    renderProducts();
    refreshProductSelect();
}


async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
        alert("Please enter username and password.");
        return;
    }

    // STEP 1: Login API
    let data;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        data = await response.json();

        if (!data.success) {
            alert(data.message);
            return;
        }

    } catch (error) {
        console.error("Login API error:", error);
        alert("Unable to connect to the login backend.");
        return;
    }

    // STEP 2: Login successful
    currentUser = data.user;

    alert("Login successful!");

    // STEP 3: Load products
try {

    await loadProducts();

} catch (error) {

    console.error("Product loading error:", error);

    alert("Login successful, but products could not be loaded: " + error.message);

    return;
}

// STEP 3.5: Load bill history

try {

    await loadBills();

} catch (error) {

    console.error("Bill history loading error:", error);

    alert("Login successful, but bill history could not be loaded: " + error.message);

    return;
}


// STEP 4: Open dashboard
    try {
        showPage("dashboard");
        
} catch (error) {
        console.error("Dashboard error:", error);
        alert("Login successful, but dashboard could not be opened: " + error.message);
} 
}


  function updateDashboard() {

    document.getElementById("totalProducts").textContent = products.length;

    document.getElementById("totalStock").textContent =
        products.reduce((sum, p) => sum + Number(p.stock), 0);

    document.getElementById("totalBills").textContent = bills.length;

    document.getElementById("totalSales").textContent =
        bills.reduce((sum, b) => sum + Number(b.total), 0).toFixed(2);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("password").addEventListener("keydown", e => {
        if (e.key === "Enter") login();
    });

    updateDashboard();
});


async function saveProduct() {
    const id = document.getElementById("productId").value;
    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("productCategory").value.trim();
    const price = Number(document.getElementById("productPrice").value);
    const stock = Number(document.getElementById("productStock").value);

    if (!name || !category || isNaN(price) || isNaN(stock) || price < 0 || stock < 0) {
        alert("Please enter valid product details.");
        return;
    }

    const productData = {
        name,
        category,
        price,
        stock
    };

    try {
        let response;

        if (id) {
            // UPDATE
            response = await fetch(`${API_URL}/products/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(productData)
            });
        } else {
            // ADD
            response = await fetch(`${API_URL}/products`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(productData)
            });
        }

        if (!response.ok) {
            throw new Error("Failed to save product");
        }

        await loadProducts();

        clearProductForm();

        alert(id
            ? "Product updated successfully."
            : "Product added successfully.");

    } catch (error) {
        console.error("Error saving product:", error);
        alert("Failed to save product.");
    }
}


async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;

    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Failed to delete product");
        }

        await loadProducts();

        alert("Product deleted successfully.");

    } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product.");
    }
}

function showPage(pageId) {
    // Hide login page
    document.getElementById("loginPage").classList.add("hidden");

    // Show main application
    document.getElementById("app").classList.remove("hidden");

    // Hide all pages
    const pages = document.querySelectorAll(".page");

    pages.forEach(page => {
        page.classList.add("hidden");
    });

    // Show selected page
    const page = document.getElementById(pageId);

    if (page) {
        page.classList.remove("hidden");
    } else {
        console.error("Page not found:", pageId);
    }
}

function renderProducts() {
    const table = document.getElementById("productTable");
    const searchInput = document.getElementById("productSearch");

    if (!table) return;

    const search = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    const filteredProducts = products.filter(product =>
        String(product.name).toLowerCase().includes(search) ||
        String(product.category).toLowerCase().includes(search)
    );

    table.innerHTML = "";

    if (filteredProducts.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6">No products found.</td>
            </tr>
        `;
        return;
    }

    filteredProducts.forEach(product => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>₹${Number(product.price).toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                <button onclick="editProduct(${product.id})">Edit</button>
                <button onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        `;

        table.appendChild(row);
    });
}

function refreshProductSelect() {
    const select = document.getElementById("billProduct");

    if (!select) return;

    select.innerHTML = `
        <option value="">Select Product</option>
    `;

    products.forEach(product => {
        const option = document.createElement("option");

        option.value = product.id;
        option.textContent =
            `${product.name} - ₹${Number(product.price).toFixed(2)} (Stock: ${product.stock})`;

        select.appendChild(option);
    });
}

function clearProductForm() {
    document.getElementById("productId").value = "";
    document.getElementById("productName").value = "";
    document.getElementById("productCategory").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productStock").value = "";
}

function editProduct(id) {
    const product = products.find(p => Number(p.id) === Number(id));

    if (!product) {
        alert("Product not found.");
        return;
    }

    document.getElementById("productId").value = product.id;
    document.getElementById("productName").value = product.name;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productStock").value = product.stock;

    showPage("products");
}

function logout() {
    currentUser = null;

    document.getElementById("app").classList.add("hidden");
    document.getElementById("loginPage").classList.remove("hidden");

    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
}

function addToBill() {
    
    const productId = Number(document.getElementById("billProduct").value);
    const quantity = Number(document.getElementById("billQuantity").value);

    if (!productId) {
        alert("Please select a product.");
        return;
    }

    if (!quantity || quantity < 1) {
        alert("Please enter a valid quantity.");
        return;
    }

    const product = products.find(
        p => Number(p.id) === productId
    );

    if (!product) {
        alert("Product not found.");
        return;
    }

    if (quantity > Number(product.stock)) {
        alert(`Only ${product.stock} units available in stock.`);
        return;
    }

    const existingItem = currentBill.find(
        item => Number(item.productId) === productId
    );

    if (existingItem) {
        if (existingItem.quantity + quantity > Number(product.stock)) {
            alert(`Only ${product.stock} units available in stock.`);
            return;
        }

        existingItem.quantity += quantity;
        existingItem.amount =
            existingItem.price * existingItem.quantity;
    } else {
        currentBill.push({
            productId: product.id,
            productName: product.name,
            price: Number(product.price),
            quantity: quantity,
            amount: Number(product.price) * quantity
        });
    }

    renderBill();
}

function renderBill() {
    const table = document.getElementById("billTable");

    if (!table) return;

    table.innerHTML = "";

    if (currentBill.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5">No items added to bill.</td>
            </tr>
        `;
        return;
    }

    currentBill.forEach((item, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.productName}</td>
            <td>₹${Number(item.price).toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>₹${Number(item.amount).toFixed(2)}</td>
            <td>
                <button onclick="removeFromBill(${index})">Remove</button>
            </td>
        `;

        table.appendChild(row);
        updateBillSummary();
    });
}

function removeFromBill(index) {
    currentBill.splice(index, 1);
    renderBill();
    updateBillSummary();
}

function updateBillSummary() {
    const subtotal = currentBill.reduce(
        (sum, item) => sum + Number(item.amount),
        0
    );

    const gst = subtotal * GST_RATE;
    const grandTotal = subtotal + gst;

    document.getElementById("subtotal").textContent =
        `₹${subtotal.toFixed(2)}`;

    document.getElementById("gst").textContent =
        `₹${gst.toFixed(2)}`;

    document.getElementById("grandTotal").textContent =
        `₹${grandTotal.toFixed(2)}`;
}

async function generateBill() {
    if (currentBill.length === 0) {
        alert("Please add at least one product to the bill.");
        return;
    }

    const customer = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();

    if (!customer) {
        alert("Please enter customer name.");
        return;
    }

    const subtotal = currentBill.reduce(
        (sum, item) => sum + Number(item.amount),
        0
    );

    const gst = subtotal * GST_RATE;
    const total = subtotal + gst;

    const billData = {
        customer: customer,
        phone: phone,
        subtotal: subtotal,
        gst: gst,
        total: total,
        items: currentBill
    };

    try {
        const response = await fetch(`${API_URL}/bills`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(billData)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to generate bill");
        }

        alert(`Bill generated successfully! Bill No: ${data.billId}`);

        clearBill();
        await loadProducts();
        await loadBills();

    } catch (error) {
        console.error("Generate bill error:", error);
        alert("Failed to generate bill: " + error.message);
    }
}

function clearBill() {
    currentBill = [];

    document.getElementById("customerName").value = "";
    document.getElementById("customerPhone").value = "";
    document.getElementById("billQuantity").value = 1;

    renderBill();
    updateBillSummary();
}

// LOAD BILL HISTORY
async function loadBills() {
    try {
        const response = await fetch(`${API_URL}/bills`);

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load bills");
        }

        bills = data.bills;

        renderHistory();

        updateDashboard();

    } catch (error) {
        console.error("Load bills error:", error);
        alert("Failed to load bill history: " + error.message);
    }
}

// RENDER BILL HISTORY
function renderHistory() {
    const table = document.getElementById("historyTable");

    if (!table) return;

    const searchInput = document.getElementById("historySearch");
    const searchText = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    table.innerHTML = "";

    const filteredBills = bills.filter(bill => {
        return (
            String(bill.id).toLowerCase().includes(searchText) ||
            String(bill.customer).toLowerCase().includes(searchText) ||
            String(bill.phone || "").toLowerCase().includes(searchText)
        );
    });

    if (filteredBills.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6">No bills found.</td>
            </tr>
        `;
        return;
    }

    filteredBills.forEach((bill) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${bill.id}</td>
            <td>${bill.customer}</td>
            <td>${bill.phone || "-"}</td>
            <td>${new Date(bill.created_at).toLocaleString()}</td>
            <td>₹${Number(bill.total).toFixed(2)}</td>
            <td>
                <button onclick="viewBill(${bill.id})">View</button>
            </td>
        `;

        table.appendChild(row);
    });
}

// VIEW SINGLE BILL
async function viewBill(billId) {
    try {
        const response = await fetch(`${API_URL}/bills/${billId}`);

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load bill");
        }

        const bill = data.bill;
        const items = data.items;

        let itemsHTML = "";

        items.forEach(item => {
            itemsHTML += `
                <tr>
                    <td>${item.product_name}</td>
                    <td>₹${Number(item.price).toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>₹${Number(item.amount).toFixed(2)}</td>
                </tr>
            `;
        });

        const billDetails = `
            <h2>Grocery Billing System</h2>
            <p><strong>Bill No:</strong> ${bill.id}</p>
            <p><strong>Customer:</strong> ${bill.customer}</p>
            <p><strong>Phone:</strong> ${bill.phone || "-"}</p>
            <p><strong>Date:</strong> ${new Date(bill.created_at).toLocaleString()}</p>

            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>

            <br>

            <p><strong>Subtotal:</strong> ₹${Number(bill.subtotal).toFixed(2)}</p>
            <p><strong>GST:</strong> ₹${Number(bill.gst).toFixed(2)}</p>
            <p><strong>Grand Total:</strong> ₹${Number(bill.total).toFixed(2)}</p>
        `;

        document.getElementById("billPreview").innerHTML = billDetails;

        document.getElementById("billModal").classList.remove("hidden");

    } catch (error) {
        console.error("View bill error:", error);
        alert("Failed to load bill: " + error.message);
    }
}

// CLOSE BILL MODAL
function closeModal() {
    document.getElementById("billModal").classList.add("hidden");
}

// PRINT BILL
function printBill() {
    const billContent = document.getElementById("billPreview").innerHTML;

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Grocery Bill</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 30px;
                }

                h2 {
                    text-align: center;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }

                th, td {
                    border: 1px solid #000;
                    padding: 8px;
                    text-align: left;
                }

                .total {
                    text-align: right;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            ${billContent}
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    printWindow.print();
    printWindow.close();
}

