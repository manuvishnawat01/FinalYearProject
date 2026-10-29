import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print 'Page X of Y' 
    along with running header and footer.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Do not draw running header on cover page (page 1)
        if self._pageNumber > 1:
            # Running Header
            self.drawString(54, 11 * inch - 36, "MediChronicle AI — Comprehensive Project Architecture & Technical Report")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)

        # Running Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 46, 8.5 * inch - 54, 46)

        footer_text = "Final Year B.Tech Engineering Project — Confidential & Academic Evaluation"
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawString(54, 32, footer_text)
        self.drawRightString(8.5 * inch - 54, 32, page_str)

        self.restoreState()


def build_pdf(filename="MediChronicle_AI_Complete_Project_Report.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Palettes
    PRIMARY = colors.HexColor("#1D4ED8")     # Blue
    SECONDARY = colors.HexColor("#0F766E")   # Teal
    NAVY = colors.HexColor("#0F172A")        # Deep Dark Slate/Navy
    BODY = colors.HexColor("#334155")        # Slate Body
    BG_LIGHT = colors.HexColor("#F8FAFC")    # Card / Box Background
    BORDER = colors.HexColor("#E2E8F0")      # Border Slate
    AMBER = colors.HexColor("#B45309")       # Warning Amber

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=NAVY,
        alignment=TA_LEFT
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        alignment=TA_LEFT
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=NAVY,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=BODY,
        alignment=TA_JUSTIFY,
        spaceAfter=6
    )

    body_bold = ParagraphStyle(
        'Body_Bold_Custom',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=NAVY
    )

    callout_text = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=NAVY
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11.5,
        textColor=NAVY
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=BODY
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell,
        fontName='Helvetica-Bold',
        textColor=NAVY
    )

    story = []

    # ==========================================
    # COVER / HEADER BLOCK
    # ==========================================
    story.append(Paragraph("MediChronicle AI", title_style))
    story.append(Paragraph("Unified Lifetime Health Memory, Active Pharmaceutical Salt Intelligence & Clinical Decision-Support System", subtitle_style))
    story.append(Spacer(1, 10))

    meta_table_data = [
        [
            Paragraph("<b>Project:</b> Final-Year B.Tech Major Project", table_cell_bold),
            Paragraph("<b>Author / Candidate:</b> Manu Pratap Singh", table_cell_bold),
        ],
        [
            Paragraph("<b>Domain:</b> Clinical Decision Support, Medical Informatics", table_cell),
            Paragraph("<b>Repository:</b> github.com/manuvishnawat01/FinalYearProject", table_cell),
        ],
        [
            Paragraph("<b>Frontend Live:</b> final-year-project-seven-wheat.vercel.app", table_cell),
            Paragraph("<b>Backend Live:</b> medichronicle-backend.onrender.com", table_cell),
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[250, 254])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceBefore=4, spaceAfter=10))

    # ==========================================
    # 1. EXECUTIVE SUMMARY & PROBLEM STATEMENT
    # ==========================================
    story.append(Paragraph("1. Executive Summary & Clinical Problem Statement", h1_style))
    story.append(Paragraph(
        "Modern healthcare delivery suffers from severe information fragmentation. Patients accumulate physical paper laboratory reports, handwritten prescription slips, hospital discharge summaries, and scattered glucometer/blood pressure readings. When presenting to a new physician or specialist, patients face <b>information asymmetry</b>: the physician typically has only 5 to 10 minutes to review months of complex medical history.",
        body_style
    ))
    story.append(Paragraph(
        "This fragmentation creates four critical clinical and economic failure modes:",
        body_style
    ))

    problems = [
        ("1. Active Pharmaceutical Ingredient (Salt) Duplication:", 
         "Pharmaceutical manufacturers market identical chemical molecules under hundreds of commercial proprietary brand names. For example, a patient prescribed <i>Dolo 650</i> by a general physician and <i>Crocin Advance</i> by an orthopedic surgeon is taking identical <b>Paracetamol</b> molecules. Without chemical-level decomposition, accidental overdose and hepatotoxicity frequently occur."),
        ("2. Absence of Longitudinal Clinical Context:", 
         "An isolated blood pressure reading of 142/90 mmHg or a fasting blood sugar of 122 mg/dL tells an incomplete story. Without knowing whether this represents a 30-day upward trajectory following a dosage taper or a sudden acute spike, physicians cannot optimize therapy safely."),
        ("3. The 'Black-Box' Danger of Generative LLMs:", 
         "Standard large language models (like unmodified ChatGPT) are prone to hallucinating medical facts, fabricating laboratory reference intervals, or asserting confident clinical diagnoses without cited sources. In healthcare, ungrounded probabilistic text generation is ethically and clinically unacceptable."),
        ("4. Diagnostic Redundancy & Financial Waste:", 
         "Patients routinely repeat expensive laboratory tests (such as HbA1c, Lipid Profiles, or Serum Creatinine) simply because previous results are locked away in paper folders. Performing an HbA1c test every 2 weeks provides zero clinical utility because glycated hemoglobin reflects a 90-day physiological erythrocyte lifespan.")
    ]

    for title, desc in problems:
        story.append(Paragraph(f"<b>• {title}</b> {desc}", body_style))

    story.append(Spacer(1, 8))

    # ==========================================
    # 2. THE MEDICHRONICLE AI PARADIGM
    # ==========================================
    story.append(Paragraph("2. The MediChronicle AI Solution Paradigm", h1_style))
    story.append(Paragraph(
        "<b>MediChronicle AI</b> replaces passive document storage with an <b>active, verifiable clinical intelligence engine</b>. Rather than relying on unconstrained generative AI, MediChronicle AI is built on a <b>strict provenance hierarchy</b> where data is classified into five distinct veracity levels: <code>patient_entered</code>, <code>extracted_unverified</code>, <code>confirmed_by_user</code>, <code>clinician_recorded</code>, and <code>ai_generated</code>. An AI model can never elevate an unconfirmed guess into a verified clinical fact.",
        body_style
    ))
    story.append(Paragraph(
        "The architecture is organized around four foundational clinical pillars:",
        body_style
    ))

    pillars = [
        [Paragraph("<b>Pillar</b>", table_header), Paragraph("<b>Clinical Function</b>", table_header), Paragraph("<b>Safety Guarantee</b>", table_header)],
        [
            Paragraph("<b>1. Active Salt Intelligence</b>", table_cell_bold),
            Paragraph("Normalizes proprietary commercial brand names into active pharmaceutical compounds (salts) and computes combination overlap.", table_cell),
            Paragraph("Automated set-intersection prevents accidental double-dosing and highlights drug-drug interaction warnings.", table_cell)
        ],
        [
            Paragraph("<b>2. Longitudinal Trend Engine</b>", table_cell_bold),
            Paragraph("Tracks time-series vitals (paired systolic/diastolic BP, contextual glucose) against evidence-based clinical guidelines (JNC-8 / ADA).", table_cell),
            Paragraph("Mathematical absolute and normalized percentage change with boundary protection against zero-division.", table_cell)
        ],
        [
            Paragraph("<b>3. Constrained Bilingual Explainer</b>", table_cell_bold),
            Paragraph("Translates complex laboratory findings into plain English and conversational Hindi for patient comprehension.", table_cell),
            Paragraph("Exact numerical laboratory values and units are strictly preserved to eliminate numerical translation errors; attaches PubMed citations.", table_cell)
        ],
        [
            Paragraph("<b>4. Zero-Trust Audit & Delegation</b>", table_cell_bold),
            Paragraph("Enables granular caregiver access delegation (view reports, view vitals, view medicines) with instant revocation.", table_cell),
            Paragraph("4-Dimensional uncertainty decomposition (Extraction, Identity, Evidence, Interpretation) and tamper-evident audit logs.", table_cell)
        ]
    ]

    pillar_table = Table(pillars, colWidths=[120, 204, 180])
    pillar_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('BOX', (0, 0), (-1, -1), 1, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(pillar_table)
    story.append(Spacer(1, 10))

    # ==========================================
    # 3. DETAILED BREAKDOWN OF ALL 14 MODULES
    # ==========================================
    story.append(PageBreak())
    story.append(Paragraph("3. Detailed Walkthrough of the 14 Intelligence Modules", h1_style))
    story.append(Paragraph(
        "MediChronicle AI implements 14 distinct functional modules divided into Core Ingestion & Tracking, Health Records, Medicine Intelligence, Clinical Assistance, and Safety Management.",
        body_style
    ))

    modules = [
        ("Core 1: Authentication, RBAC & Security Audit",
         "Implements stateless JWT bearer token authentication, bcrypt password hashing, and role-based access control supporting Patient, Caregiver, Clinician, and Administrator roles. Every access request, permission grant, and revocation is recorded in an immutable security AuditLog table with IP tracking."),
        
        ("Core 2: Document Ingestion & Candidate OCR Extraction",
         "Accepts clinical laboratory PDFs, PNG, and JPG scans. Uses OCR pattern matching to extract candidate observation names, values, units, and reference ranges. To prevent automated misclassification from contaminating patient history, observations remain in an unconfirmed candidate queue until explicitly reviewed and confirmed by the patient or clinician."),
        
        ("Core 3: Daily Health Tracking (Vitals & Metabolic Data)",
         "Captures coupled systolic and diastolic blood pressure, resting heart rate, body weight, and contextual blood glucose. Enforces clinical validation guards: blood pressure entries must include both systolic and diastolic integers, and glucose values are paired with physiological context tags (Fasting, Pre-Meal, Post-Meal, Bedtime) to ensure medically valid longitudinal comparisons."),
        
        ("Module 1 (M1): Lifetime Patient Health Memory & Safe Search",
         "Unifies uploaded reports, laboratory observations, daily vitals, and medication regimens into a chronological timeline. Implements a constrained, parameterized search engine that translates natural language inquiries (e.g. 'Show my HbA1c results') into validated database queries. Generative SQL injection is impossible. If no matching record exists, the system reports zero records found without fabricating facts."),
        
        ("Module 2 (M2): Medicine Salt Intelligence Engine",
         "Decomposes commercial pharmaceutical products into active pharmaceutical ingredients (APIs). When a patient registers a medication, the engine evaluates set intersections across all active regimens to identify duplicate chemical compounds. Evaluates drug-drug interactions with peer-reviewed literature and features a resilient outage protocol: if an external reference service is offline, it fails safely with HTTP 503 rather than returning a dangerous false reassurance."),
        
        ("Module 3 (M3): Health Trends & Clinical Early-Warning System",
         "Constructs longitudinal time-series analytics for blood pressure, blood glucose, creatinine, and HbA1c. Evaluates readings against evidence-based medical standards (JNC-8 for hypertension stages; ADA for impaired fasting glucose and diabetes). Generates transparent warnings only when consecutive measurements breach clinical thresholds, preventing false alerts from transient spikes."),
        
        ("Module 4 (M4): Supplement & Nutrient Evidence Checker",
         "Inventories dietary supplements, multivitamins, and herbal compounds. Aggregates cumulative daily nutrient intake across products (e.g. Vitamin D3, Zinc, Calcium) and benchmarks them against Recommended Dietary Allowances (RDA) and Tolerable Upper Intake Levels (UL). For proprietary blends with undisclosed ingredient amounts, it explicitly flags missing quantities rather than erroneously assuming zero."),
        
        ("Module 5 (M5): Medical Report Explainer (Bilingual EN/HI)",
         "Translates dense, jargon-heavy laboratory reports into clear, accessible summaries in English and conversational Hindi. Crucially, the engine anchors every clinical explanation to preserved numerical findings and units (e.g. 'Creatinine: 1.1 mg/dL') and attaches verified PubMed/CDC citations alongside targeted questions for the patient's next doctor visit."),
        
        ("Module 6 (M6): Side-Effect & Symptom Correlator",
         "Logs patient health complaints with 1–10 severity ratings. Evaluates temporal proximity between symptom onset dates and recent medication initiations or dosage changes. Cross-references known adverse drug reaction (ADR) profiles and embeds deterministic red-flag emergency escalation rules (e.g., chest pain, sudden vision changes, severe dyspnea) directing patients to urgent medical care."),
        
        ("Module 7 (M7): Medicine Change Impact Tracker",
         "Maintains an auditable log of regimen modifications (initiations, stops, dose escalations, and brand switches). Automatically constructs before-and-after observation windows (±14, 30, 60, and 90 days) comparing blood pressure and blood glucose before and after the modification, presenting objective mathematical differences with neutral, non-causal language."),
        
        ("Module 8 (M8): Prescription-to-Package Verification",
         "Conducts side-by-side discrepancy audits comparing written doctor prescriptions against photographs of dispensed pharmacy packaging. Compares drug name, salt composition, dosage strength, form (tablets vs capsules), and frequency. Flags clerical dispensing errors while displaying prominent disclaimers that digital verification does not verify chemical authenticity."),
        
        ("Module 9 (M9): Doctor Visit Preparation Generator",
         "Synthesizes authenticated patient records into a high-density, 1-page pre-consultation clinical agenda. Features custom patient question builders and exports genuine binary PDF files generated dynamically on the server using Python ReportLab. The resulting PDF enables focused, productive clinical consultations."),
        
        ("Module 10 (M10): AI Confidence & Uncertainty Decomposition",
         "Provides transparent, auditable lineage for all machine learning and algorithmic inferences. Decomposes confidence into four independent uncertainty dimensions: Extraction Uncertainty (OCR image quality), Identity Uncertainty (chemical compound matching), Evidence Uncertainty (medical literature strength), and Clinical Interpretation Uncertainty. Features an interactive citation URL trust validator."),
        
        ("Module 11 (M11): Family Health Management & Granular Permissions",
         "Provides secure caregiver delegation via single-use invitation tokens with 7-day expiration. Implements deny-by-default granular permission toggles: View Reports, View Readings, View Medicines, View Summaries, and Edit Records. Caregiver access can be revoked instantly with immediate API blocking and permanent audit logging."),
        
        ("Module 12 (M12): Healthcare Cost & Duplicate-Test Tracker",
         "Tracks out-of-pocket medical expenditures across diagnostic, pharmacy, and consultation categories with CSV spreadsheet export. Includes a 90-day redundant diagnostic order scanner that flags repeated tests within standard validity windows (e.g., repeating an HbA1c test within 90 days), helping patients eliminate redundant spending.")
    ]

    for mod_title, mod_desc in modules:
        story.append(Paragraph(f"<b>{mod_title}</b>", h2_style))
        story.append(Paragraph(mod_desc, body_style))
        story.append(Spacer(1, 2))

    # ==========================================
    # 4. SYSTEM ARCHITECTURE & DATA FLOW
    # ==========================================
    story.append(PageBreak())
    story.append(Paragraph("4. Technical Architecture, Data Flow & Security Guardrails", h1_style))
    story.append(Paragraph(
        "MediChronicle AI follows a modern, decoupled client-server architecture designed for high scalability, type safety, and zero-trust security.",
        body_style
    ))

    arch_rows = [
        [Paragraph("<b>Component Layer</b>", table_header), Paragraph("<b>Technology / Framework</b>", table_header), Paragraph("<b>Architectural Responsibility</b>", table_header)],
        [
            Paragraph("<b>Frontend Client</b>", table_cell_bold),
            Paragraph("React 19, TypeScript 5.9, Vite 6, Tailwind CSS v4, Lucide Icons, React Router v7", table_cell),
            Paragraph("Responsive, multi-page healthcare design system. Communicates with backend via authenticated REST API with client-side SPA routing fallback.", table_cell)
        ],
        [
            Paragraph("<b>API Gateway & Controllers</b>", table_cell_bold),
            Paragraph("FastAPI 0.115+, Uvicorn 0.28+, Starlette Middleware", table_cell),
            Paragraph("Asynchronous request dispatching, Pydantic v2 schema validation, JWT bearer token authorization, configurable CORS headers.", table_cell)
        ],
        [
            Paragraph("<b>Business Logic & Engines</b>", table_cell_bold),
            Paragraph("14 Specialized Python Domain Services", table_cell),
            Paragraph("Active salt normalizer, trend early-warning calculator, symptom temporal correlator, bilingual translator, ReportLab PDF canvas compiler.", table_cell)
        ],
        [
            Paragraph("<b>Persistence Layer</b>", table_cell_bold),
            Paragraph("SQLAlchemy 2.0 ORM, SQLite / PostgreSQL", table_cell),
            Paragraph("Relational persistence with foreign keys, cascading rules, and automated cloud postgres:// URL translation for cloud providers.", table_cell)
        ],
        [
            Paragraph("<b>Cloud Infrastructure</b>", table_cell_bold),
            Paragraph("Render (PaaS) & Vercel (Edge CDN)", table_cell),
            Paragraph("Automated CI/CD from GitHub main branch. Vercel edge reverse proxy eliminates CORS barriers and routes /api/v1 calls seamlessly.", table_cell)
        ]
    ]

    arch_table = Table(arch_rows, colWidths=[110, 180, 214])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), SECONDARY),
        ('BOX', (0, 0), (-1, -1), 1, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Clinical Safety & Hallucination Elimination Protocols", h2_style))
    story.append(Paragraph(
        "1. <b>Provenance Tagging:</b> Every data point has an immutable source tag. Unconfirmed OCR findings cannot influence clinical interaction alerts until confirmed by the user.<br/>"
        "2. <b>Constrained Database Queries:</b> Search queries operate on parameter-bounded database queries rather than raw SQL or generative SQL, preventing prompt-injection attacks.<br/>"
        "3. <b>Zero-Trust Interaction Provider Outage:</b> In the event of an external reference outage, the system returns HTTP 503 Service Unavailable, alerting the user to consult a pharmacist rather than returning false reassurance.<br/>"
        "4. <b>Mandatory Non-Causal Disclaimers:</b> Symptom correlator and regimen impact reports feature prominent clinical disclaimers clarifying that temporal alignment does not prove pharmacological causation.",
        body_style
    ))

    # ==========================================
    # 5. FUTURE ROADMAP & SOCIETAL IMPACT
    # ==========================================
    story.append(Spacer(1, 6))
    story.append(Paragraph("5. Future Roadmap & Societal Impact", h1_style))
    story.append(Paragraph(
        "<b>1. Ayushman Bharat Digital Mission (ABDM) & ABHA Integration:</b> Connecting MediChronicle AI to India's national health data highway via FHIR protocols will allow seamless ingestion of electronic health records from hospitals across India.<br/>"
        "<b>2. IoT & Continuous Sensor Ingestion:</b> Integrating Bluetooth Low Energy (BLE) protocols for Continuous Glucose Monitors (CGMs) and smart blood pressure cuffs to provide real-time vital streams.<br/>"
        "<b>3. Generic Medicine Economic Recommender:</b> Expanding the Active Salt Intelligence engine to cross-reference the <i>Jan Aushadhi</i> national drug database, suggesting bioequivalent generic medicines that reduce chronic medication costs by 50% to 80%.<br/>"
        "<b>4. Multi-Regional Language Expansion:</b> Extending the bilingual translation engine beyond Hindi to include Tamil, Telugu, Bengali, Marathi, and Kannada.",
        body_style
    ))

    # ==========================================
    # 6. FACULTY VIVA Q&A DEFENSE CHEAT SHEET
    # ==========================================
    story.append(PageBreak())
    story.append(Paragraph("6. Faculty Viva-Voce Examination & Defense Cheat Sheet", h1_style))
    story.append(Paragraph(
        "Key questions and precise, authoritative technical answers for faculty evaluation and project viva:",
        body_style
    ))

    qna = [
        ("Q1: How do you prevent AI hallucinations in medical summaries?",
         "MediChronicle AI enforces a zero-trust provenance hierarchy. All data is tagged with veracity states. AI models do not write directly to verified tables; they produce candidate summaries that must anchor to physical document IDs or confirmed lab observations. In bilingual translations, numerical laboratory values (e.g. 1.1 mg/dL) are extracted and preserved verbatim, and every claim requires verified PubMed citations."),
        
        ("Q2: How does the Salt Intelligence Engine detect duplicate ingredients across commercial brands?",
         "Commercial drug brand names are normalized into their constituent chemical compounds (ActiveSalt entities). The backend computes set intersections across active medications. If a patient is prescribed two different brands containing overlapping chemical salts (e.g. Amlodipine 5mg in Brand A and Amlodipine 2.5mg in Brand B), the engine flags an active duplicate salt overlap to prevent accidental toxicity."),
        
        ("Q3: What happens if an external clinical drug database goes offline?",
         "A critical medical software requirement is safe failure. Rather than returning a dangerous false negative ('No interactions found'), the system handles provider outages gracefully with HTTP 503 Outage Handling, displaying an explicit alert that interaction verification is temporarily unavailable and advising consultation with a pharmacist."),
        
        ("Q4: Why use ReportLab for PDF generation instead of frontend window.print()?",
         "Browser-based window.print() is unreliable: it varies across operating systems, depends on client CSS, lacks deterministic page-break control, and cannot generate encrypted binary attachments. ReportLab programmatically constructs vector PDFs directly on the server with deterministic typography, tables, and security headers suitable for official clinical handoffs."),
        
        ("Q5: How does your family delegation protect patient privacy?",
         "We implement deny-by-default role-based access control (RBAC). Caregiver access requires single-use cryptographically signed invitation tokens with a 7-day expiry. Patients can toggle granular boolean permissions (can_view_reports, can_view_readings, can_view_medicines, can_view_summaries, can_edit). Revocation is instant and permanently logged in the security audit trail."),
        
        ("Q6: How do you deploy the frontend and backend without CORS issues?",
         "The frontend is deployed on Vercel's Edge CDN and the backend on Render. In frontend/vercel.json, we configured an edge rewrite proxy that forwards all /api/v1/* requests to the Render backend. The browser communicates with the same origin, eliminating cross-origin resource sharing (CORS) rejections while keeping the architecture cleanly decoupled.")
    ]

    for q, a in qna:
        story.append(Paragraph(f"<b>{q}</b>", h2_style))
        story.append(Paragraph(f"<b>Ans:</b> {a}", body_style))
        story.append(Spacer(1, 4))

    # ==========================================
    # BUILD DOCUMENT
    # ==========================================
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated: {os.path.abspath(filename)}")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "MediChronicle_AI_Complete_Project_Report.pdf"
    build_pdf(out_file)
