# 🚀 TELOS - MASTER PROJECT CONTEXT DOCUMENT

> **Course**: 23CB1811 - Project Review (Zeroth Review & Final Project)  
> **Department**: Department of Computer Science and Business Systems (CSBS)  
> **Project Title**: **TELOS: Hyperlocal Peer-to-Peer (P2P) Asset Sharing Economy Platform**  
> **Subtitle**: Zero-Trust Escrow Ledgers, Cryptographic QR Handoffs & Privacy-Preserving Spatial Obfuscation  

---

## 1. 📌 Project Overview & Concept
**TELOS** is a zero-trust, hyperlocal peer-to-peer (P2P) asset sharing economy platform designed to enable community members within a neighborhood to safely lease underutilized physical assets—such as power tools, specialized electronics, camping gear, lawn equipment, and academic textbooks.

Unlike traditional classifieds or commercial rental services, Telos solves the fundamental challenges of **privacy exposure**, **payment disputes**, **unreturned items**, and **physical handoff repudiation** using:
1. **PostGIS Radial Spatial Obfuscation** (concealing exact home addresses prior to handoff agreement).
2. **Virtual Escrows & Multi-Split Wallet Ledgers** (locking security deposits and rental fees until safe item return).
3. **Cryptographic Time-Bound QR Code Verification** (providing non-repudiable proof of physical pickup and return).

---

## 2. ⚡ Core Problem Statement
1. **Physical Handoff Disputes**: Lack of physical proof of exchange in informal rentals leads to non-acknowledgment of returns, stolen goods, and false claims.
2. **Privacy Exposure**: Traditional platforms display exact residential addresses publicly during item browsing, exposing lenders to stalking and burglary risks.
3. **Financial Risk & Deposit Withholding**: Peer transactions lack escrow ledgers, causing lenders to risk stolen items and borrowers to risk withheld security deposits.
4. **Underutilized Household Capital**: Billions of dollars of household equipment sit idle because neighbors lack trust mechanisms and automated contract enforcement.

---

## 3. 🛠️ Key Technical Innovations & Algorithms

### 3.1. Privacy-Preserving Location Obfuscation (PostGIS)
* Lenders list items with spatial coordinates (`Point(lng, lat)`).
* For unapproved requests, Telos applies a **randomized 2km–5km bounding area obfuscation** using PostGIS `ST_DWithin` spatial indexing. Lenders and borrowers can discover nearby items without exposing exact residential coordinates until both parties approve the contract.

### 3.2. Virtual Escrow & Multi-Split Wallet Ledger
* Built around a strict, enum-driven **State Machine**:
  `AVAILABLE` $\rightarrow$ `REQUESTED` $\rightarrow$ `APPROVED` $\rightarrow$ `ACTIVE` $\rightarrow$ `RETURNED` (or `OVERDUE`)
* When a borrower requests an item, funds (Rental Fee + Security Deposit) are debited from their wallet and locked into a **Virtual Escrow Vault** (`status = HELD`).
* Upon return verification, the escrow automatically splits funds:
  * **Rental Income** $\rightarrow$ Lender’s Wallet.
  * **Security Deposit** $\rightarrow$ Returned to Borrower’s Wallet.
  * **Late Fees / Penalties** (if overdue) $\rightarrow$ Deducted automatically from deposit via daily background cron jobs.

### 3.3. Cryptographic Time-Bound QR Code Verification
* Handoffs are authenticated using SHA-256 hashed, time-expiring QR tokens:
  * `pickup_qr_hash`: Generated upon approval; scanned by lender to transition state from `APPROVED` $\rightarrow$ `ACTIVE`.
  * `return_qr_hash`: Generated upon item return; scanned by lender to transition state from `ACTIVE` $\rightarrow$ `RETURNED` and release escrow.

---

## 4. 🗄️ Database Architecture & Schemas

### ERD Entity Relationships
* `USERS` $\leftrightarrow$ `WALLETS` (1-to-1)
* `USERS` $\leftrightarrow$ `ITEMS` (1-to-Many, Lender)
* `USERS` $\leftrightarrow$ `ITEM_TRANSACTIONS` (1-to-Many, Borrower)
* `ITEMS` $\leftrightarrow$ `ITEM_TRANSACTIONS` (1-to-Many)
* `ITEM_TRANSACTIONS` $\leftrightarrow$ `ESCROWS` (1-to-1)
* `USERS` $\leftrightarrow$ `KYC_DOCUMENTS` & `PAYMENT_RECEIPTS` (1-to-Many)

### Main Tables
1. **`users`**: `id`, `firebase_uid`, `email`, `display_name`, `location` (Spatial Point), `kyc_status`.
2. **`wallets`**: `id`, `user_id`, `available_balance`, `locked_balance`, `earned_balance`.
3. **`items`**: `id`, `owner_id`, `title`, `description`, `category`, `price`, `security_deposit`, `status`.
4. **`item_transactions`**: `id`, `item_id`, `borrower_id`, `status`, `start_date`, `end_date`, `pickup_qr_hash`, `return_qr_hash`.
5. **`escrows`**: `id`, `transaction_id`, `borrower_id`, `lender_id`, `locked_fee`, `locked_deposit`, `status`.
6. **`kyc_documents`** & **`payment_receipts`**: Manual/Automated admin audit tables for identity & manual payment compliance.

---

## 5. 📚 IEEE Basepapers (2024–2025)

1. **Primary Basepaper (Location Privacy - 2025)**:
   * Z. Zheng, Z. Li, S. Long, S. Guo, C. Chen, K. Xu, *"Location Privacy: A Differentially Private Data Sharing Framework for Location-Based Peer-to-Peer Services,"* **IEEE Transactions on Dependable and Secure Computing (TDSC)**, vol. 22, no. 4, pp. 2410–2424, July–Aug. 2025.
2. **Supporting Basepaper (Cryptographic Handoffs - 2024)**:
   * F. Song, J. Liang, C. Zhang, et al., *"Achieving Efficient and Privacy-Preserving Location-Based Task Recommendation in Spatial Crowdsourcing,"* **IEEE Transactions on Dependable and Secure Computing (TDSC)**, vol. 21, no. 4, pp. 1890–1904, July–Aug. 2024.
3. **Supporting Basepaper (Escrow & Trust Management - 2024)**:
   * M. A. Khan, et al., *"Blockchain-Enabled Trust Management with Location Privacy Preservation in Decentralized Peer-to-Peer Systems,"* **IEEE Internet of Things Journal (IoT-J)**, vol. 11, no. 8, pp. 14205–14218, April 2024.

---

## 6. 💻 Tech Stack & Architecture
* **Frontend**: React / Next.js / HTML5 / Modern Responsive Vanilla CSS
* **Backend**: Node.js, Express.js REST APIs / State Machine Controllers
* **Database**: PostgreSQL with PostGIS extension (Spatial Queries)
* **Authentication**: Firebase Authentication
* **Security & Crypto**: SHA-256 QR Hashing, Coordinate Obfuscation

---

## 🤖 COPY-PASTE PROMPT FOR OTHER AIs

```text
You are an expert AI assistant helping me with my engineering project called "TELOS". Here is the complete context of the project:

PROJECT NAME: TELOS - Hyperlocal Peer-to-Peer (P2P) Asset Sharing Economy Platform
DEPARTMENT: Computer Science and Business Systems (CSBS)
COURSE: 23CB1811 - Project Review

CORE OVERVIEW:
Telos is a zero-trust, hyperlocal peer-to-peer asset sharing platform designed for community members to lease underutilized items (tools, electronics, equipment, books) safely within neighborhoods.

TECHNICAL HIGHLIGHTS:
1. Privacy-Preserving Location Obfuscation: Uses PostGIS spatial queries (ST_DWithin) with a randomized 2km-5km bounding area to mask exact home addresses prior to transaction approval.
2. Virtual Escrow & Multi-Split Wallet Ledger: Uses an automated state machine (AVAILABLE -> REQUESTED -> APPROVED -> ACTIVE -> RETURNED) locking security deposits and rental fees during active rentals to prevent fraud.
3. Cryptographic QR Handoff Verification: Employs SHA-256 hashed time-bound QR tokens for pickup and return events to guarantee physical proof of exchange and trigger automated late-fee calculations.

DATABASE SCHEMAS:
- users (id, firebase_uid, email, location, kyc_status)
- wallets (id, user_id, available_balance, locked_balance, earned_balance)
- items (id, owner_id, title, category, price, security_deposit, status)
- item_transactions (id, item_id, borrower_id, status, start_date, end_date, pickup_qr_hash, return_qr_hash)
- escrows (id, transaction_id, borrower_id, lender_id, locked_fee, locked_deposit, status)

IEEE BASEPAPER:
"Location Privacy: A Differentially Private Data Sharing Framework for Location-Based Peer-to-Peer Services", published in IEEE Transactions on Dependable and Secure Computing (TDSC), Vol. 22, Issue 4, July-August 2025.

Keep this context in mind for all follow-up questions, code generation, diagram design, or presentation help!
```
