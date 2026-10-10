const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Grocery Billing System Backend is running!");
});

app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS result");

        res.json({
            success: true,
            message: "MySQL connected successfully!",
            data: rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "MySQL connection failed",
            error: error.message
        });
    }
});

app.get("/api/products", async (req, res) => {
    try {
        const [products] = await pool.query(
            "SELECT * FROM products ORDER BY id ASC"
        );

        res.json(products);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error.message
        });
    }
});

// ADD PRODUCT
app.post("/api/products", async (req, res) => {
    try {
        const { name, category, price, stock } = req.body;

        if (!name || !category || price < 0 || stock < 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product details"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO products (name, category, price, stock)
             VALUES (?, ?, ?, ?)`,
            [name, category, price, stock]
        );

        const [rows] = await pool.query(
            "SELECT * FROM products WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json(rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to add product",
            error: error.message
        });
    }
});


// UPDATE PRODUCT
app.put("/api/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, price, stock } = req.body;

        const [result] = await pool.query(
            `UPDATE products
             SET name = ?, category = ?, price = ?, stock = ?
             WHERE id = ?`,
            [name, category, price, stock, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const [rows] = await pool.query(
            "SELECT * FROM products WHERE id = ?",
            [id]
        );

        res.json(rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update product",
            error: error.message
        });
    }
});


// DELETE PRODUCT
app.delete("/api/products/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            "DELETE FROM products WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to delete product",
            error: error.message
        });
    }
});


// LOGIN
app.post("/api/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        const [users] = await pool.query(
            "SELECT id, username, role FROM users WHERE username = ? AND password = ?",
            [username, password]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        res.json({
            success: true,
            message: "Login successful",
            user: users[0]
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
});

// GENERATE BILL
app.post("/api/bills", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            customer,
            phone,
            subtotal,
            gst,
            total,
            items
        } = req.body;

        if (!customer || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Customer name and bill items are required"
            });
        }

        await connection.beginTransaction();

        // 1. Save bill
        const [billResult] = await connection.query(
            `INSERT INTO bills
            (customer, phone, subtotal, gst, total)
            VALUES (?, ?, ?, ?, ?)`,
            [customer, phone || null, subtotal, gst, total]
        );

        const billId = billResult.insertId;

        // 2. Save bill items
        for (const item of items) {
            await connection.query(
                `INSERT INTO bill_items
                (bill_id, product_id, product_name, price, quantity, amount)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    billId,
                    item.productId,
                    item.productName,
                    item.price,
                    item.quantity,
                    item.amount
                ]
            );

            // 3. Reduce product stock
            const [stockResult] = await connection.query(
                `UPDATE products
                 SET stock = stock - ?
                 WHERE id = ? AND stock >= ?`,
                [item.quantity, item.productId, item.quantity]
            );

            if (stockResult.affectedRows === 0) {
                throw new Error(
                    `Insufficient stock for ${item.productName}`
                );
            }
        }

        await connection.commit();

        res.json({
            success: true,
            message: "Bill generated successfully",
            billId: billId
        });

    } catch (error) {
        await connection.rollback();

        console.error("Generate bill error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate bill",
            error: error.message
        });

    } finally {
        connection.release();
    }
});

// GET ALL BILLS
app.get("/api/bills", async (req, res) => {
    try {
        const [bills] = await pool.query(
            `SELECT id, customer, phone, subtotal, gst, total, created_at
             FROM bills
             ORDER BY id DESC`
        );

        res.json({
            success: true,
            bills: bills
        });

    } catch (error) {
        console.error("Get bills error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch bills",
            error: error.message
        });
    }
});

// GET SINGLE BILL WITH ITEMS
app.get("/api/bills/:id", async (req, res) => {
    try {
        const billId = req.params.id;

        const [bills] = await pool.query(
            `SELECT id, customer, phone, subtotal, gst, total, created_at
             FROM bills
             WHERE id = ?`,
            [billId]
        );

        if (bills.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Bill not found"
            });
        }

        const [items] = await pool.query(
            `SELECT product_id, product_name, price, quantity, amount
             FROM bill_items
             WHERE bill_id = ?`,
            [billId]
        );

        res.json({
            success: true,
            bill: bills[0],
            items: items
        });

    } catch (error) {
        console.error("Get single bill error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch bill",
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});