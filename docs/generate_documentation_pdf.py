#!/usr/bin/env python3
"""
Dependency-free PDF generator for the Telos platform documentation.

This script writes a multi-page, styled PDF using only the Python standard
library and the 14 standard PDF base fonts (Helvetica family + Courier),
so it requires no third-party packages and no font embedding.

Run:  python3 generate_documentation_pdf.py
Out:  Telos_Platform_Documentation.pdf  (next to this script)
"""

import os
import zlib

# ---------------------------------------------------------------------------
# Standard AFM character widths (per 1000 units) for the base-14 fonts.
# Helvetica-Oblique shares Helvetica widths. Courier is monospaced (600).
# Index by ASCII code 32..126.
# ---------------------------------------------------------------------------
HELV = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,
        556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,
        722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,
        667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,
        556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,
        500,334,260,334,584]

HELVB = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,
         556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,
         722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,
         667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,
         611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,
         500,389,280,389,584]

def char_width(ch, font, size):
    code = ord(ch)
    if font == "Courier":
        w = 600
    elif font == "Helvetica-Bold":
        w = HELVB[code - 32] if 32 <= code <= 126 else 556
    else:  # Helvetica or Helvetica-Oblique
        w = HELV[code - 32] if 32 <= code <= 126 else 556
    return w / 1000.0 * size

def text_width(s, font, size):
    return sum(char_width(c, font, size) for c in s)

# ---------------------------------------------------------------------------
# Page / layout configuration
# ---------------------------------------------------------------------------
PAGE_W, PAGE_H = 612.0, 792.0           # US Letter
MARGIN_L, MARGIN_R = 64.0, 64.0
MARGIN_T, MARGIN_B = 72.0, 64.0
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R

# Brand palette
NAVY   = (0.09, 0.16, 0.31)   # deep navy
TEAL   = (0.07, 0.55, 0.55)   # accent teal
SLATE  = (0.27, 0.31, 0.38)   # body-ish slate
GRAY   = (0.45, 0.49, 0.55)
LIGHT  = (0.93, 0.95, 0.97)   # light panel
CODEBG = (0.96, 0.96, 0.93)
BLACK  = (0.12, 0.12, 0.14)
WHITE  = (1, 1, 1)

def esc(s):
    return s.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")

def sanitize(s):
    """Map a few common unicode chars to Latin-1 friendly equivalents."""
    repl = {
        "\u2019": "'", "\u2018": "'", "\u201c": '"', "\u201d": '"',
        "\u2013": "-", "\u2014": "-", "\u2022": "-", "\u2026": "...",
        "\u2192": "->", "\u00a0": " ", "\u2192": "->", "\u2705": "+",
    }
    for k, v in repl.items():
        s = s.replace(k, v)
    return "".join(c if ord(c) < 256 else "?" for c in s)

# ---------------------------------------------------------------------------
# Document model: a Doc holds pages; each page is a list of drawing ops
# rendered to a content stream.
# ---------------------------------------------------------------------------
class Doc:
    def __init__(self):
        self.pages = []          # each page = list of stream-fragment strings
        self.new_page()
        self.y = PAGE_H - MARGIN_T
        self.toc = []            # (level, title, page_index)

    def new_page(self):
        self.pages.append([])
        self.y = PAGE_H - MARGIN_T
        return len(self.pages) - 1

    @property
    def cur(self):
        return self.pages[-1]

    # --- low level drawing -------------------------------------------------
    def rect(self, x, y, w, h, color):
        r, g, b = color
        self.cur.append(f"{r:.3f} {g:.3f} {b:.3f} rg {x:.2f} {y:.2f} {w:.2f} {h:.2f} re f")

    def line(self, x1, y1, x2, y2, color, width=1.0):
        r, g, b = color
        self.cur.append(
            f"{r:.3f} {g:.3f} {b:.3f} RG {width:.2f} w {x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S")

    def text(self, x, y, s, font, size, color):
        r, g, b = color
        fmap = {"Helvetica": "F1", "Helvetica-Bold": "F2",
                "Helvetica-Oblique": "F3", "Courier": "F4"}
        self.cur.append(
            f"BT /{fmap[font]} {size:.2f} Tf {r:.3f} {g:.3f} {b:.3f} rg "
            f"{x:.2f} {y:.2f} Td ({esc(sanitize(s))}) Tj ET")

    # --- space management --------------------------------------------------
    def ensure(self, needed):
        if self.y - needed < MARGIN_B:
            self.new_page()

    def space(self, amt):
        self.y -= amt
        if self.y < MARGIN_B:
            self.new_page()

    # --- word wrapping -----------------------------------------------------
    def wrap(self, s, font, size, max_w):
        words = s.split()
        lines, cur = [], ""
        for w in words:
            trial = w if not cur else cur + " " + w
            if text_width(trial, font, size) <= max_w:
                cur = trial
            else:
                if cur:
                    lines.append(cur)
                # hard-break very long single word
                if text_width(w, font, size) > max_w:
                    piece = ""
                    for ch in w:
                        if text_width(piece + ch, font, size) <= max_w:
                            piece += ch
                        else:
                            lines.append(piece)
                            piece = ch
                    cur = piece
                else:
                    cur = w
        if cur:
            lines.append(cur)
        return lines or [""]

    # --- high level blocks -------------------------------------------------
    def paragraph(self, s, font="Helvetica", size=10.5, color=SLATE,
                  leading=15.0, indent=0.0, space_after=8.0, x=None):
        x = (MARGIN_L + indent) if x is None else x
        max_w = CONTENT_W - indent
        for ln in self.wrap(s, font, size, max_w):
            self.ensure(leading)
            self.text(x, self.y - size, ln, font, size, color)
            self.y -= leading
        self.y -= space_after

    def bullet(self, s, size=10.5, color=SLATE, leading=15.0, space_after=4.0,
               marker="-", indent=0.0, marker_color=TEAL):
        bx = MARGIN_L + 6 + indent
        tx = bx + 14
        max_w = CONTENT_W - (tx - MARGIN_L)
        lines = self.wrap(s, "Helvetica", size, max_w)
        for i, ln in enumerate(lines):
            self.ensure(leading)
            if i == 0:
                self.text(bx, self.y - size, marker, "Helvetica-Bold", size, marker_color)
            self.text(tx, self.y - size, ln, "Helvetica", size, color)
            self.y -= leading
        self.y -= space_after

    def kv(self, key, val, size=10.5, leading=15.0, space_after=4.0, key_w=150):
        """Two-column key/value row with wrapping value."""
        kx = MARGIN_L + 6
        vx = MARGIN_L + 6 + key_w
        max_w = CONTENT_W - (vx - MARGIN_L)
        lines = self.wrap(val, "Helvetica", size, max_w)
        self.ensure(leading)
        self.text(kx, self.y - size, key, "Helvetica-Bold", size, NAVY)
        for i, ln in enumerate(lines):
            if i > 0:
                self.ensure(leading)
            self.text(vx, self.y - size, ln, "Helvetica", size, SLATE)
            self.y -= leading
        self.y -= space_after

    def h1(self, s):
        self.space(10)
        self.ensure(46)
        self.toc.append((1, s, len(self.pages) - 1))
        # accent bar + heading
        self.rect(MARGIN_L, self.y - 22, 5, 24, TEAL)
        self.text(MARGIN_L + 14, self.y - 18, s, "Helvetica-Bold", 17, NAVY)
        self.y -= 30
        self.line(MARGIN_L, self.y, PAGE_W - MARGIN_R, self.y, LIGHT, 1.0)
        self.y -= 12

    def h2(self, s):
        self.space(6)
        self.ensure(28)
        self.toc.append((2, s, len(self.pages) - 1))
        self.text(MARGIN_L, self.y - 13, s, "Helvetica-Bold", 13, TEAL)
        self.y -= 20

    def h3(self, s):
        self.space(4)
        self.ensure(22)
        self.text(MARGIN_L, self.y - 11, s, "Helvetica-Bold", 11, NAVY)
        self.y -= 17

    def code_block(self, lines, size=8.8, leading=12.0, title=None):
        pad = 8
        block_h = len(lines) * leading + 2 * pad + (14 if title else 0)
        self.ensure(block_h + 6)
        top = self.y
        self.rect(MARGIN_L, top - block_h, CONTENT_W, block_h, CODEBG)
        self.rect(MARGIN_L, top - block_h, 3, block_h, GRAY)
        yy = top - pad
        if title:
            self.text(MARGIN_L + 12, yy - 9, title, "Helvetica-Bold", 8.8, GRAY)
            yy -= 14
        for ln in lines:
            self.text(MARGIN_L + 12, yy - size, ln, "Courier", size, BLACK)
            yy -= leading
        self.y = top - block_h - 10

    def panel(self, title, body_lines, fill=LIGHT, accent=TEAL):
        """A callout panel with a title and body paragraph lines."""
        pad = 10
        # pre-measure
        wrapped = []
        for b in body_lines:
            wrapped.extend(self.wrap(b, "Helvetica", 10, CONTENT_W - 2 * pad - 6))
        block_h = 18 + len(wrapped) * 14 + 2 * pad
        self.ensure(block_h + 6)
        top = self.y
        self.rect(MARGIN_L, top - block_h, CONTENT_W, block_h, fill)
        self.rect(MARGIN_L, top - block_h, 4, block_h, accent)
        self.text(MARGIN_L + 14, top - pad - 11, title, "Helvetica-Bold", 11, NAVY)
        yy = top - pad - 11 - 16
        for ln in wrapped:
            self.text(MARGIN_L + 14, yy, ln, "Helvetica", 10, SLATE)
            yy -= 14
        self.y = top - block_h - 10

# ---------------------------------------------------------------------------
# PDF assembly
# ---------------------------------------------------------------------------
def build_pdf(doc, out_path, title="Telos Platform Documentation"):
    # Footer for every page except the title page (index 0)
    total = len(doc.pages)
    for i, page in enumerate(doc.pages):
        if i == 0:
            continue
        # footer line + text
        page.append(f"{LIGHT[0]:.3f} {LIGHT[1]:.3f} {LIGHT[2]:.3f} RG 0.8 w "
                    f"{MARGIN_L:.2f} {MARGIN_B-14:.2f} m {PAGE_W-MARGIN_R:.2f} {MARGIN_B-14:.2f} l S")
        left = "Telos  |  Hyperlocal P2P Sharing Economy Platform"
        right = f"Page {i+1} of {total}"
        page.append(
            f"BT /F1 8 Tf {GRAY[0]:.3f} {GRAY[1]:.3f} {GRAY[2]:.3f} rg "
            f"{MARGIN_L:.2f} {MARGIN_B-26:.2f} Td ({esc(left)}) Tj ET")
        rw = text_width(right, "Helvetica", 8)
        page.append(
            f"BT /F1 8 Tf {GRAY[0]:.3f} {GRAY[1]:.3f} {GRAY[2]:.3f} rg "
            f"{PAGE_W-MARGIN_R-rw:.2f} {MARGIN_B-26:.2f} Td ({esc(right)}) Tj ET")

    objects = []
    def add_obj(s):
        objects.append(s)
        return len(objects)  # 1-based id

    # Fonts
    f1 = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
    f2 = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
    f3 = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>")
    f4 = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>")

    page_obj_ids = []
    content_ids = []
    for page in doc.pages:
        stream = "\n".join(page).encode("latin-1", "replace")
        comp = zlib.compress(stream)
        cid = add_obj(("<< /Length %d /Filter /FlateDecode >>\nstream\n" % len(comp)).encode("latin-1") + comp + b"\nendstream")
        content_ids.append(cid)

    # Pages need the Pages parent id; reserve it
    pages_id = len(objects) + len(doc.pages) + 1  # will set after creating page objs
    res = (f"<< /Font << /F1 {f1} 0 R /F2 {f2} 0 R /F3 {f3} 0 R /F4 {f4} 0 R >> >>")
    for cid in content_ids:
        pid = add_obj(f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 {PAGE_W:.0f} {PAGE_H:.0f}] "
                      f"/Resources {res} /Contents {cid} 0 R >>")
        page_obj_ids.append(pid)

    kids = " ".join(f"{pid} 0 R" for pid in page_obj_ids)
    real_pages_id = add_obj(f"<< /Type /Pages /Kids [{kids}] /Count {len(page_obj_ids)} >>")
    # fix parent refs if mismatch
    if real_pages_id != pages_id:
        for pid in page_obj_ids:
            objects[pid-1] = objects[pid-1].replace(f"/Parent {pages_id} 0 R",
                                                    f"/Parent {real_pages_id} 0 R")

    info_id = add_obj(f"<< /Title ({esc(title)}) /Author (Telos Engineering) "
                      f"/Subject (Technical and Product Documentation) "
                      f"/Creator (Telos PDF Generator) >>")
    catalog_id = add_obj(f"<< /Type /Catalog /Pages {real_pages_id} 0 R /PageLayout /SinglePage >>")

    # Serialize
    out = bytearray()
    out += b"%PDF-1.5\n%\xe2\xe3\xcf\xd3\n"
    offsets = [0] * (len(objects) + 1)
    for idx, body in enumerate(objects, start=1):
        offsets[idx] = len(out)
        out += f"{idx} 0 obj\n".encode("latin-1")
        if isinstance(body, bytes):
            out += body
        else:
            out += body.encode("latin-1")
        out += b"\nendobj\n"
    xref_pos = len(out)
    n = len(objects) + 1
    out += f"xref\n0 {n}\n".encode("latin-1")
    out += b"0000000000 65535 f \n"
    for idx in range(1, n):
        out += f"{offsets[idx]:010d} 00000 n \n".encode("latin-1")
    out += b"trailer\n"
    out += f"<< /Size {n} /Root {catalog_id} 0 R /Info {info_id} 0 R >>\n".encode("latin-1")
    out += b"startxref\n"
    out += f"{xref_pos}\n".encode("latin-1")
    out += b"%%EOF\n"

    with open(out_path, "wb") as fh:
        fh.write(out)
    return len(out)

# ---------------------------------------------------------------------------
# Title page
# ---------------------------------------------------------------------------
def render_title(doc):
    # full navy header band
    doc.rect(0, PAGE_H - 250, PAGE_W, 250, NAVY)
    doc.rect(0, PAGE_H - 256, PAGE_W, 6, TEAL)
    # wordmark
    doc.text(MARGIN_L, PAGE_H - 130, "TELOS", "Helvetica-Bold", 54, WHITE)
    doc.text(MARGIN_L + 4, PAGE_H - 160, "Hyperlocal Peer-to-Peer Sharing Economy Platform",
             "Helvetica", 14, (0.78, 0.86, 0.90))
    doc.text(MARGIN_L + 4, PAGE_H - 210, "Technical & Product Documentation",
             "Helvetica-Oblique", 12, TEAL)

    doc.y = PAGE_H - 320
    doc.paragraph(
        "Telos (from the Greek 'telos', meaning purpose or end goal) is a platform that lets "
        "neighbours share, lend, borrow, and rent everyday items and skills within their immediate "
        "geographic community. This document describes the product vision, system architecture, "
        "technology choices, data model, API surface, security posture, and delivery roadmap.",
        size=11.5, leading=17, color=SLATE, space_after=24)

    # meta panel
    doc.panel("Document Overview", [
        "Project: Telos - Hyperlocal P2P Sharing Economy Platform",
        "Backend: Java 21, Spring Boot 4.1, PostgreSQL + PostGIS, Hibernate Spatial",
        "Frontend: Single-page web application (to be implemented)",
        "Audience: Engineers, product stakeholders, and new contributors",
        "Status: Foundation / scaffolding phase",
    ])

    doc.space(6)
    doc.text(MARGIN_L, doc.y - 10, "Version 1.0", "Helvetica-Bold", 10, NAVY)
    doc.text(MARGIN_L, doc.y - 26, "Generated automatically from the project repository.",
             "Helvetica-Oblique", 9.5, GRAY)

# ---------------------------------------------------------------------------
# Table of contents (rendered after body so page numbers are known)
# ---------------------------------------------------------------------------
def render_toc(doc, toc_page_index):
    saved = doc.pages
    # render into the reserved toc page
    page = doc.pages[toc_page_index]
    page.clear()
    # temporarily point drawing at toc page
    doc.pages.append.__self__  # no-op safety
    # Manually draw since helpers append to last page; swap technique:
    real_last = doc.pages
    # We'll build content directly.
    y = PAGE_H - MARGIN_T
    def t(x, yy, s, font, size, color):
        r, g, b = color
        fmap = {"Helvetica": "F1", "Helvetica-Bold": "F2",
                "Helvetica-Oblique": "F3", "Courier": "F4"}
        page.append(f"BT /{fmap[font]} {size:.2f} Tf {r:.3f} {g:.3f} {b:.3f} rg "
                    f"{x:.2f} {yy:.2f} Td ({esc(sanitize(s))}) Tj ET")
    # heading
    page.append(f"{TEAL[0]:.3f} {TEAL[1]:.3f} {TEAL[2]:.3f} rg "
                f"{MARGIN_L:.2f} {y-22:.2f} 5 24 re f")
    t(MARGIN_L + 14, y - 18, "Table of Contents", "Helvetica-Bold", 17, NAVY)
    y -= 30
    page.append(f"{LIGHT[0]:.3f} {LIGHT[1]:.3f} {LIGHT[2]:.3f} RG 1 w "
                f"{MARGIN_L:.2f} {y:.2f} m {PAGE_W-MARGIN_R:.2f} {y:.2f} l S")
    y -= 22
    for level, title, pidx in doc.toc:
        if level == 1:
            font, size, color, x = "Helvetica-Bold", 11, NAVY, MARGIN_L
            y -= 4
        else:
            font, size, color, x = "Helvetica", 10, SLATE, MARGIN_L + 18
        page_no = pidx + 1
        num = str(page_no)
        t(x, y - size, title, font, size, color)
        # dotted leader
        title_w = text_width(title, font, size)
        num_w = text_width(num, "Helvetica", size)
        dot_start = x + title_w + 6
        dot_end = PAGE_W - MARGIN_R - num_w - 6
        if dot_end > dot_start:
            dots = ""
            dotw = char_width(".", "Helvetica", size)
            ndots = int((dot_end - dot_start) / dotw)
            dots = "." * max(0, ndots)
            t(dot_start, y - size, dots, "Helvetica", size, (0.7, 0.74, 0.78))
        t(PAGE_W - MARGIN_R - num_w, y - size, num, "Helvetica", size, GRAY)
        y -= 16
    doc.pages = real_last

# ---------------------------------------------------------------------------
# Body content
# ---------------------------------------------------------------------------
def render_body(doc):
    # ---- Executive Summary ----
    doc.h1("1. Executive Summary")
    doc.paragraph(
        "Telos is a hyperlocal, peer-to-peer (P2P) sharing economy platform. It connects neighbours "
        "so they can lend, borrow, rent, and exchange physical items and services within walking or "
        "short-driving distance of one another. Instead of every household buying tools, equipment, "
        "and occasionally-used goods, Telos turns a neighbourhood into a shared inventory.")
    doc.paragraph(
        "The platform's defining characteristic is proximity. Every listing, search, and match is "
        "anchored to geographic location. This is enforced at the database layer using PostgreSQL "
        "with the PostGIS extension and accessed through Hibernate Spatial, so distance and radius "
        "queries are first-class, indexed operations rather than application-side calculations.")
    doc.panel("In one sentence", [
        "Telos helps communities access more while owning less, by making the things and skills "
        "around them easy to discover, trust, and borrow."])

    # ---- Vision & Problem ----
    doc.h1("2. Vision & Problem Statement")
    doc.h2("2.1 The problem")
    doc.bullet("Underused assets: drills, ladders, pressure washers, and party supplies sit idle "
               "in garages for 99% of their life.")
    doc.bullet("Overconsumption: people repeatedly buy items they need only once or twice, creating "
               "cost and waste.")
    doc.bullet("Weak local ties: neighbours often do not know what help or resources exist a few "
               "doors away.")
    doc.bullet("Trust friction: existing marketplaces are global and anonymous, which makes lending "
               "physical goods feel risky.")
    doc.h2("2.2 The vision")
    doc.paragraph(
        "Telos aims to make borrowing from a neighbour as frictionless as ordering a product online, "
        "while rebuilding the social trust that makes sharing sustainable. Success looks like dense, "
        "active neighbourhood networks where access replaces ownership for a meaningful share of "
        "everyday goods and services.")

    # ---- Solution Overview ----
    doc.h1("3. Solution Overview")
    doc.paragraph(
        "Telos provides a marketplace built around three primitives: people (users tied to a "
        "location), listings (items or services offered), and transactions (a borrow, rent, or "
        "exchange agreement between two users). A reputation system and location-aware discovery "
        "sit on top of these primitives.")
    doc.h2("3.1 Core user journeys")
    doc.bullet("Discover: a user searches for an item or service and sees results ranked by distance.")
    doc.bullet("Request: the borrower requests an item for a date range; the owner approves or declines.")
    doc.bullet("Exchange: the two parties meet locally to hand over the item; status updates track the loan.")
    doc.bullet("Return & review: the item is returned and both parties leave a rating that feeds reputation.")

    # ---- Key Features ----
    doc.h1("4. Key Features")
    doc.h2("4.1 Minimum viable product (MVP)")
    doc.bullet("User registration, authentication, and a profile anchored to a home location.")
    doc.bullet("Create, edit, and delete listings for items or services, including photos and availability.")
    doc.bullet("Location-aware search: 'find what is available within X km of me', sorted by distance.")
    doc.bullet("Borrow / rent request workflow with owner approval and a clear transaction lifecycle.")
    doc.bullet("Ratings and reviews that build a per-user trust score.")
    doc.h2("4.2 Planned enhancements")
    doc.bullet("In-app messaging between borrower and owner.")
    doc.bullet("Optional deposits and payments for rentals.")
    doc.bullet("Notifications (email / push) for requests, approvals, and due dates.")
    doc.bullet("Categories, tags, and saved searches.")
    doc.bullet("Community groups (a building, a street, a campus) as trust boundaries.")

    # ---- Architecture ----
    doc.h1("5. System Architecture")
    doc.paragraph(
        "Telos follows a conventional, well-understood layered architecture: a client application "
        "talks to a stateless REST API, which persists to a spatial relational database. This keeps "
        "the system easy to reason about, test, and scale horizontally at the API tier.")
    doc.h2("5.1 High-level components")
    doc.code_block([
        "+-------------------+        HTTPS / REST        +----------------------+",
        "|   Frontend SPA    |  <--------------------->   |   Spring Boot API    |",
        "|  (web client)     |        JSON payloads       |   (stateless)        |",
        "+-------------------+                            +----------+-----------+",
        "                                                            |",
        "                                                  JPA / Hibernate Spatial",
        "                                                            |",
        "                                                 +----------v-----------+",
        "                                                 |  PostgreSQL + PostGIS |",
        "                                                 |  (spatial indexes)    |",
        "                                                 +----------------------+",
    ], title="Logical architecture")
    doc.h2("5.2 Backend layering")
    doc.bullet("Controller layer: REST endpoints, request validation, and DTO mapping.")
    doc.bullet("Service layer: business rules, transaction lifecycle, and authorization checks.")
    doc.bullet("Repository layer: Spring Data JPA repositories, including spatial queries.")
    doc.bullet("Domain layer: JPA entities, including geometry fields managed by Hibernate Spatial.")
    doc.h2("5.3 Why this shape")
    doc.paragraph(
        "A stateless API tier means instances can be added behind a load balancer as traffic grows. "
        "Pushing geographic logic into PostGIS keeps proximity queries fast and correct, and avoids "
        "loading large candidate sets into application memory just to filter them by distance.")

    # ---- Technology Stack ----
    doc.h1("6. Technology Stack")
    doc.paragraph("The current stack is drawn directly from the backend build configuration "
                  "(pom.xml) and project layout.")
    doc.kv("Language", "Java 21 (LTS)")
    doc.kv("Framework", "Spring Boot 4.1.0 (spring-boot-starter-parent)")
    doc.kv("Web layer", "Spring Web MVC (spring-boot-starter-webmvc)")
    doc.kv("Persistence", "Spring Data JPA + Hibernate ORM")
    doc.kv("Spatial", "Hibernate Spatial (geometry types, distance queries)")
    doc.kv("Database", "PostgreSQL (with the PostGIS extension)")
    doc.kv("Boilerplate", "Project Lombok (annotation-based, compile-time only)")
    doc.kv("Build tool", "Apache Maven (Maven Wrapper included: mvnw / mvnw.cmd)")
    doc.kv("Testing", "spring-boot-starter-*-test (JPA slice & web MVC tests)")
    doc.panel("Note on dependencies", [
        "The build pins Spring Boot 4.1.0 and Java 21. Hibernate Spatial and the PostgreSQL driver "
        "together enable indexed geographic queries, which are central to Telos's hyperlocal model."])

    # ---- Data Model ----
    doc.h1("7. Data Model")
    doc.paragraph(
        "The domain centres on four primary entities. Locations are stored as spatial geometry so "
        "the database can index and query them efficiently.")
    doc.h2("7.1 Entities")
    doc.h3("User")
    doc.bullet("id, displayName, email, passwordHash")
    doc.bullet("homeLocation (Point geometry, SRID 4326) - the anchor for proximity")
    doc.bullet("reputationScore, createdAt")
    doc.h3("Listing")
    doc.bullet("id, owner (User), title, description, type (ITEM or SERVICE)")
    doc.bullet("location (Point geometry), category, photos")
    doc.bullet("availabilityStatus, pricePerDay or 'free', createdAt")
    doc.h3("Transaction")
    doc.bullet("id, listing, borrower (User), owner (User)")
    doc.bullet("startDate, endDate, status (REQUESTED, APPROVED, ACTIVE, RETURNED, CANCELLED)")
    doc.bullet("createdAt, updatedAt")
    doc.h3("Review")
    doc.bullet("id, transaction, author (User), subject (User)")
    doc.bullet("rating (1-5), comment, createdAt")
    doc.h2("7.2 Relationships")
    doc.bullet("A User owns many Listings.")
    doc.bullet("A Listing has many Transactions over its lifetime.")
    doc.bullet("A Transaction produces up to two Reviews (borrower rates owner and vice versa).")
    doc.h2("7.3 Example spatial query")
    doc.code_block([
        "-- Listings within 5 km of a point, nearest first (PostGIS)",
        "SELECT l.*,",
        "       ST_Distance(l.location, :origin) AS distance_m",
        "FROM   listing l",
        "WHERE  ST_DWithin(l.location, :origin, 5000)",
        "  AND  l.availability_status = 'AVAILABLE'",
        "ORDER  BY distance_m ASC;",
    ], title="PostGIS radius search")

    # ---- API ----
    doc.h1("8. API Design")
    doc.paragraph(
        "The API is REST over HTTPS, exchanging JSON. Endpoints below are the proposed surface for "
        "the MVP; they map cleanly onto the entities and user journeys described above.")
    doc.h2("8.1 Representative endpoints")
    doc.code_block([
        "POST   /api/auth/register          Create an account",
        "POST   /api/auth/login             Obtain a session / token",
        "",
        "GET    /api/listings               Search listings (?lat,&lng,&radiusKm,&q)",
        "POST   /api/listings               Create a listing",
        "GET    /api/listings/{id}          Listing details",
        "PUT    /api/listings/{id}          Update a listing",
        "DELETE /api/listings/{id}          Remove a listing",
        "",
        "POST   /api/transactions           Request to borrow / rent",
        "PATCH  /api/transactions/{id}      Approve, decline, or update status",
        "GET    /api/transactions           List my transactions",
        "",
        "POST   /api/reviews                Leave a review for a transaction",
    ], title="MVP REST surface")
    doc.h2("8.2 Conventions")
    doc.bullet("Standard HTTP status codes (200, 201, 400, 401, 403, 404, 409).")
    doc.bullet("Pagination via page and size query parameters on list endpoints.")
    doc.bullet("Consistent error envelope with a machine-readable code and human message.")
    doc.bullet("DTOs separate the API contract from internal JPA entities.")

    # ---- Frontend ----
    doc.h1("9. Frontend")
    doc.paragraph(
        "The frontend directory is currently a placeholder. The intended client is a single-page "
        "web application that consumes the REST API and presents a map- and list-based discovery "
        "experience centred on the user's location.")
    doc.h2("9.1 Expected responsibilities")
    doc.bullet("Capture the user's location (with consent) and request listings within a radius.")
    doc.bullet("Display results both as a ranked list and on an interactive map.")
    doc.bullet("Provide listing creation, request management, and review submission flows.")
    doc.bullet("Handle authentication state and protect borrower/owner-only actions.")

    # ---- Security & Trust ----
    doc.h1("10. Security, Privacy & Trust")
    doc.bullet("Passwords are stored only as salted hashes; never in plain text.")
    doc.bullet("All traffic is served over HTTPS; tokens are scoped and expiring.")
    doc.bullet("Authorization checks ensure users can only modify their own listings and transactions.")
    doc.bullet("Location privacy: exact coordinates are approximated/obfuscated in public responses; "
               "precise meet-up details are shared only after a request is approved.")
    doc.bullet("Reputation scores and reviews provide social accountability for borrowing physical goods.")
    doc.panel("Privacy principle", [
        "Proximity is the product, but precision is sensitive. Telos should reveal that something is "
        "'nearby' long before it reveals exactly where someone lives."])

    # ---- Build & Run ----
    doc.h1("11. Building & Running")
    doc.h2("11.1 Prerequisites")
    doc.bullet("Java Development Kit 21")
    doc.bullet("PostgreSQL with the PostGIS extension enabled")
    doc.bullet("Maven (or use the bundled wrapper, mvnw)")
    doc.h2("11.2 Common commands")
    doc.code_block([
        "# from the backend/ directory",
        "./mvnw clean verify        # compile, run tests, and package",
        "./mvnw spring-boot:run     # start the API locally",
        "",
        "# enable PostGIS once per database",
        "CREATE EXTENSION IF NOT EXISTS postgis;",
    ], title="Backend commands")
    doc.paragraph(
        "Database connection settings belong in src/main/resources/application.properties (currently "
        "minimal). At minimum the datasource URL, username, password, and the Hibernate dialect "
        "appropriate for PostGIS should be configured before running against a real database.")

    # ---- Project structure ----
    doc.h1("12. Repository Structure")
    doc.code_block([
        "Telos/",
        "  README.md",
        "  backend/",
        "    pom.xml                 # Maven build, Spring Boot 4.1, Java 21",
        "    mvnw, mvnw.cmd          # Maven wrapper",
        "    src/main/java/com/telos/backend/",
        "        BackendApplication.java",
        "    src/main/resources/",
        "        application.properties",
        "    src/test/java/com/telos/backend/",
        "        BackendApplicationTests.java",
        "  frontend/                 # placeholder for the web client",
        "  docs/",
        "    generate_documentation_pdf.py",
        "    Telos_Platform_Documentation.pdf",
    ], title="Directory tree")

    # ---- Roadmap ----
    doc.h1("13. Delivery Roadmap")
    doc.h2("Phase 1 - Foundation (current)")
    doc.bullet("Spring Boot project scaffolding, build pipeline, and spatial database wiring.")
    doc.h2("Phase 2 - Core marketplace")
    doc.bullet("User accounts, listings CRUD, and location-aware search.")
    doc.h2("Phase 3 - Transactions & trust")
    doc.bullet("Borrow/rent workflow, transaction lifecycle, ratings and reviews.")
    doc.h2("Phase 4 - Engagement")
    doc.bullet("Messaging, notifications, and a polished web client.")
    doc.h2("Phase 5 - Growth")
    doc.bullet("Payments/deposits, community groups, and mobile clients.")

    # ---- Glossary ----
    doc.h1("14. Glossary")
    doc.kv("Hyperlocal", "Scoped to a very small geographic area, e.g. a neighbourhood.", key_w=120)
    doc.kv("P2P", "Peer-to-peer; individuals transact directly with each other.", key_w=120)
    doc.kv("PostGIS", "A spatial extension to PostgreSQL for geographic objects and queries.", key_w=120)
    doc.kv("SRID 4326", "The coordinate system for standard WGS84 latitude/longitude.", key_w=120)
    doc.kv("Telos", "Greek for 'purpose' or 'end goal'; the platform's namesake.", key_w=120)

    # ---- Closing ----
    doc.h1("15. Conclusion")
    doc.paragraph(
        "Telos reframes the things and skills already present in a neighbourhood as a shared, "
        "discoverable resource. By anchoring every interaction to location and reinforcing it with "
        "reputation, the platform lowers the cost of access while strengthening local trust. The "
        "foundation described here - a stateless Spring Boot API over a spatial PostgreSQL database "
        "- is intentionally simple, giving the team a clear and scalable path from MVP to a thriving "
        "community marketplace.")

# ---------------------------------------------------------------------------
def main():
    doc = Doc()
    # Page 1: title
    render_title(doc)
    # Page 2: reserved for TOC (filled after body)
    toc_page = doc.new_page()
    # Body starts page 3
    doc.new_page()
    render_body(doc)
    # Now fill the reserved TOC page using collected headings
    render_toc(doc, toc_page)

    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            "Telos_Platform_Documentation.pdf")
    size = build_pdf(doc, out_path)
    print(f"Wrote {out_path} ({size} bytes, {len(doc.pages)} pages)")

if __name__ == "__main__":
    main()
