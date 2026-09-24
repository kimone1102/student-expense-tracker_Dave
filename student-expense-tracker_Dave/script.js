import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";


// ===============================
// FIREBASE
// ===============================

const firebaseConfig = {
    apiKey: "AIzaSyBZwZXraLLQJO23dc8gYFjJsDaC2H2qi6Y",
    authDomain: "p2cruddave.firebaseapp.com",
    projectId: "p2cruddave",
    storageBucket: "p2cruddave.firebasestorage.app",
    messagingSenderId: "1007636172211",
    appId: "1:1007636172211:web:2dca51f18f1e070d25cfc6",
    measurementId: "G-9BXEZ1K3CZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase berhasil terhubung!");


// ===============================
// DATA
// ===============================

// Anggaran awal
const initialBudget = 1500000;

// Semua transaksi
let expenses = [];


// ===============================
// ELEMENT HTML
// ===============================

const descriptionInput =
    document.getElementById("description");

const amountInput =
    document.getElementById("amount");

const categoryInput =
    document.getElementById("category");

const addButton =
    document.getElementById("addExpense");

const expenseList =
    document.getElementById("expenseList");


// ===============================
// TAMBAH TRANSAKSI
// ===============================

addButton.addEventListener("click", async function () {

    const description =
        descriptionInput.value.trim();

    const amount =
        Number(amountInput.value);

    const category =
        categoryInput.value;


    // Cek deskripsi
    if (description === "") {
        alert("Deskripsi harus diisi.");
        return;
    }


    // Cek nominal
    if (amount <= 0 || isNaN(amount)) {
        alert("Nominal harus lebih dari 0.");
        return;
    }


    // Tentukan jenis transaksi
    let type;

    if (category === "Uang Saku") {
        type = "income";
    } else {
        type = "expense";
    }


    // Buat data transaksi
    const transaction = {

        date: new Date().toLocaleDateString("id-ID"),

        description: description,

        amount: amount,

        category: category,

        type: type

    };


    // Masukkan ke array
    expenses.push(transaction);


    // Simpan ke Firestore
    try {

        await addDoc(
            collection(db, "expenses"),
            transaction
        );

        console.log("Data berhasil disimpan ke Firestore");

    } catch (error) {

        console.error(
            "Gagal menyimpan ke Firestore:",
            error
        );

    }


    // Tampilkan data
    renderExpenses();

    // Update ringkasan
    updateSummary();


    // Kosongkan form
    descriptionInput.value = "";

    amountInput.value = "";


    alert(
        type === "income"
            ? "Uang saku berhasil ditambahkan!"
            : "Pengeluaran berhasil ditambahkan!"
    );

});


// ===============================
// TAMPILKAN TRANSAKSI
// ===============================

function renderExpenses() {

    expenseList.innerHTML = "";


    if (expenses.length === 0) {

        expenseList.innerHTML = `
            <tr>
                <td colspan="5">
                    Belum ada data pengeluaran.
                    Silakan tambahkan di atas.
                </td>
            </tr>
        `;

        return;
    }


    expenses.forEach(function (expense, index) {

        const row =
            document.createElement("tr");


        const label =
            expense.type === "income"
                ? "Uang Saku"
                : expense.category;


        const amountDisplay =
            expense.type === "income"
                ? "+ " + formatRupiah(expense.amount)
                : "- " + formatRupiah(expense.amount);


        row.innerHTML = `

            <td>
                ${expense.date}
            </td>

            <td>
                ${expense.description}
            </td>

            <td>
                ${label}
            </td>

            <td>
                ${amountDisplay}
            </td>

            <td>

                <button
                    class="delete-btn"
                    data-index="${index}">

                    Hapus

                </button>

            </td>

        `;


        // Tombol hapus
        row
            .querySelector(".delete-btn")
            .addEventListener("click", function () {

                deleteExpense(index);

            });


        expenseList.appendChild(row);

    });

}


// ===============================
// HAPUS TRANSAKSI
// ===============================

function deleteExpense(index) {

    expenses.splice(index, 1);

    renderExpenses();

    updateSummary();

}


// ===============================
// UPDATE RINGKASAN
// ===============================

function updateSummary() {


    // ===========================
    // TOTAL UANG SAKU
    // ===========================

    const totalIncome =
        expenses
            .filter(function (expense) {

                return expense.type === "income";

            })
            .reduce(function (sum, expense) {

                return sum + expense.amount;

            }, 0);


    // ===========================
    // TOTAL PENGELUARAN
    // ===========================

    const totalExpense =
        expenses
            .filter(function (expense) {

                return expense.type === "expense";

            })
            .reduce(function (sum, expense) {

                return sum + expense.amount;

            }, 0);


    // ===========================
    // TOTAL BULAN INI
    // ===========================

    document
        .getElementById("monthlyExpense")
        .textContent =
        formatRupiah(totalExpense);


    // ===========================
    // SISA ANGGARAN
    // ===========================

    const remaining =
        initialBudget +
        totalIncome -
        totalExpense;


    document
        .getElementById("remainingBudget")
        .textContent =
        formatRupiah(remaining);


    // ===========================
    // PENGELUARAN HARI INI
    // ===========================

    const today =
        new Date().toLocaleDateString("id-ID");


    const todayTotal =
        expenses
            .filter(function (expense) {

                return (
                    expense.date === today &&
                    expense.type === "expense"
                );

            })
            .reduce(function (sum, expense) {

                return sum + expense.amount;

            }, 0);


    document
        .getElementById("todayExpense")
        .textContent =
        formatRupiah(todayTotal);

}


// ===============================
// FORMAT RUPIAH
// ===============================

function formatRupiah(number) {

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    ).format(number);

}


// ===============================
// TAMPILKAN DATA FIRESTORE
// ===============================

async function loadExpenses() {

    try {

        const querySnapshot =
            await getDocs(
                collection(db, "expenses")
            );


        expenses = [];


        querySnapshot.forEach(function (doc) {

            expenses.push({
                ...doc.data(),
                firestoreId: doc.id
            });

        });


        renderExpenses();

        updateSummary();


    } catch (error) {

        console.error(
            "Gagal mengambil data:",
            error
        );

    }

}


// Jalankan saat halaman dibuka
loadExpenses();