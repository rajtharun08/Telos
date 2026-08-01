# Telos Platform — Complete IDE & Setup Guide

This document provides step-by-step instructions to set up **Supabase (PostgreSQL + PostGIS)** and run the application using **IntelliJ IDEA**, **Visual Studio Code**, **Spring Tool Suite (STS)**, or **Terminal CLI**.

---

## 🗄️ Step 1: Database Setup (Supabase)

1. Sign in at [supabase.com](https://supabase.com) and create a **New Project** (e.g. `telos-db`).
2. Save your **Database Password**.
3. Open the **SQL Editor** tab in Supabase and execute:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
4. Go to **Project Settings** ➔ **Database** ➔ Copy your **JDBC connection string**:
   ```text
   jdbc:postgresql://db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require
   ```

---

## 🚀 Step 2: Running the Spring Boot Backend (Choose Your IDE)

### Option A: IntelliJ IDEA (Community or Ultimate)

1. **Open Project**:
   - Open IntelliJ IDEA ➔ **File** ➔ **Open...** ➔ Select the `Telos` root folder.
   - IntelliJ will automatically detect Maven and import dependencies from `pom.xml`.

2. **Configure Environment Variables**:
   - Go to the top menu: **Run** ➔ **Edit Configurations...**.
   - Click the **`+`** icon ➔ Select **Spring Boot** (or **Application** if on Community Edition).
   - Set **Main Class**: `app.telos.Application`.
   - Look for **Environment variables** (click *Modify options* ➔ *Environment variables* if hidden).
   - Enter your environment variables:
     ```text
     TELOS_DB_URL=jdbc:postgresql://db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require;TELOS_DB_USER=postgres;TELOS_DB_PASSWORD=<YOUR_SUPABASE_PASSWORD>
     ```

3. **Run Application**:
   - Click **Apply** ➔ **OK**.
   - Click the green **Play ▶ button** (or press `Shift + F10`).

---

### Option B: Visual Studio Code (VS Code)

1. **Open Folder**:
   - Launch VS Code ➔ **File** ➔ **Open Folder...** ➔ Select `Telos`.

2. **Install Required Extensions**:
   - Ensure the following extension packs are installed from the Extensions Marketplace:
     - **Extension Pack for Java** (Microsoft)
     - **Spring Boot Extension Pack** (VMware)

3. **Configure `launch.json`**:
   - Create a file named `.vscode/launch.json` in the root folder with the following content:
     ```json
     {
       "version": "0.2.0",
       "configurations": [
         {
           "type": "java",
           "name": "Telos Backend",
           "request": "launch",
           "mainClass": "app.telos.Application",
           "env": {
             "TELOS_DB_URL": "jdbc:postgresql://db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require",
             "TELOS_DB_USER": "postgres",
             "TELOS_DB_PASSWORD": "<YOUR_SUPABASE_PASSWORD>"
           }
         }
       ]
     }
     ```

4. **Run Application**:
   - Press **`F5`** (or go to **Run and Debug** tab and click **Start Debugging**).

---

### Option C: Spring Tool Suite (STS) / Eclipse

1. **Import Project**:
   - Open STS / Eclipse ➔ **File** ➔ **Import...**.
   - Select **Maven** ➔ **Existing Maven Projects** ➔ Click **Next**.
   - Browse to select the `Telos` root directory ➔ Click **Finish**.

2. **Configure Run Configuration**:
   - Right-click the project in Project Explorer ➔ **Run As** ➔ **Run Configurations...**.
   - Right-click **Spring Boot App** ➔ Click **New Configuration**.
   - Set **Main type**: Click *Search* and select `app.telos.Application`.
   - Select the **Environment** tab ➔ Click **Add...** for each environment variable:
     - `TELOS_DB_URL` = `jdbc:postgresql://db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require`
     - `TELOS_DB_USER` = `postgres`
     - `TELOS_DB_PASSWORD` = `<YOUR_SUPABASE_PASSWORD>`

3. **Run Application**:
   - Click **Apply** ➔ Click **Run**.

---

### Option D: Terminal / Command Line (Maven CLI)

#### **Windows (PowerShell)**:
```powershell
$env:TELOS_DB_URL="jdbc:postgresql://db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require"
$env:TELOS_DB_USER="postgres"
$env:TELOS_DB_PASSWORD="<YOUR_SUPABASE_PASSWORD>"

mvn spring-boot:run
```

#### **Windows (Command Prompt - CMD)**:
```cmd
set TELOS_DB_URL=jdbc:postgresql://db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require
set TELOS_DB_USER=postgres
set TELOS_DB_PASSWORD=<YOUR_SUPABASE_PASSWORD>

mvn spring-boot:run
```

#### **macOS / Linux**:
```bash
export TELOS_DB_URL="jdbc:postgresql://db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require"
export TELOS_DB_USER="postgres"
export TELOS_DB_PASSWORD="<YOUR_SUPABASE_PASSWORD>"

mvn spring-boot:run
```

---

## 💻 Step 3: Running the React PWA Frontend

Once your backend is running at `http://localhost:8080`:

1. Open a terminal window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open **`http://localhost:5173`** in your web browser.

---

## 🔑 Step 4: Demo Credentials & Instant Persona Switcher

All pre-seeded demo accounts use password **`demo1234`**:

- **Aliya Rahman** *(Admin & Lender)*: `aliya.rahman@telos.app`
- **Vikram Malhotra** *(Lender)*: `vikram.malhotra@telos.app`
- **Ananya Iyer** *(Borrower)*: `ananya.iyer@telos.app`

*Tip: You can also switch active personas with 1 click using the **Persona Switcher** in the top right menu of the application!*
