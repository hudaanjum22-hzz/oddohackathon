-- EcoSphere ESG Management Platform
-- Database Initialization & Migration Script
-- Target: PostgreSQL / Supabase DB

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. MASTER DATA TABLES
-- =====================================================================

-- Departments Table (ADM-1)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    head VARCHAR(255),
    parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    employee_count INTEGER DEFAULT 0 CHECK (employee_count >= 0),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Archived')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Categories Table (ADM-2)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('CSR Activity', 'Challenge', 'Both')),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Emission Factors Table (ENV-1)
CREATE TABLE IF NOT EXISTS emission_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    co2e_factor NUMERIC(15, 6) NOT NULL CHECK (co2e_factor >= 0),
    effective_date DATE NOT NULL,
    source VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Product ESG Profile Table
CREATE TABLE IF NOT EXISTS product_esg_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product VARCHAR(255) NOT NULL,
    linked_emission_factors JSONB, -- Array of emission factor ids or notes
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Environmental Goals Table (ENV-4)
CREATE TABLE IF NOT EXISTS environmental_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    metric VARCHAR(255) NOT NULL,
    target_value NUMERIC(15, 4) NOT NULL,
    current_value NUMERIC(15, 4) DEFAULT 0,
    target_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Achieved', 'Missed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ESG Policies Table (GOV-1)
CREATE TABLE IF NOT EXISTS esg_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    effective_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Archived')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Badges Table (GAM-3)
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    unlock_rule VARCHAR(255) NOT NULL,
    icon VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Rewards Table (GAM-4)
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    points_required INTEGER NOT NULL CHECK (points_required > 0),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Out of Stock')),
    created_at TIMESTAMPTZ DEFAULT now()
);


-- =====================================================================
-- 2. TRANSACTIONAL DATA TABLES
-- =====================================================================

-- Carbon Transactions Table (ENV-2 / BR-3)
CREATE TABLE IF NOT EXISTS carbon_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_record VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    emission_factor_id UUID REFERENCES emission_factors(id) ON DELETE SET NULL,
    quantity NUMERIC(15, 4) NOT NULL CHECK (quantity >= 0),
    calculated_co2e NUMERIC(15, 6) NOT NULL CHECK (calculated_co2e >= 0),
    date DATE NOT NULL,
    calculation_method VARCHAR(50) DEFAULT 'Auto' CHECK (calculation_method IN ('Auto', 'Manual')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- CSR Activities Table (SOC-1)
CREATE TABLE IF NOT EXISTS csr_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    xp INTEGER NOT NULL CHECK (xp >= 0),
    difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    evidence_required BOOLEAN DEFAULT FALSE,
    deadline DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Under Review', 'Completed', 'Archived')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Employee CSR Activity Participation Table (SOC-2 / BR-4)
CREATE TABLE IF NOT EXISTS employee_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL, -- references auth.users(id)
    activity_id UUID REFERENCES csr_activities(id) ON DELETE CASCADE,
    proof VARCHAR(255), -- file URL proof
    approval_status VARCHAR(50) DEFAULT 'Under Review' CHECK (approval_status IN ('Under Review', 'Approved', 'Rejected')),
    points_earned INTEGER DEFAULT 0,
    completion_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Challenges Table (GAM-1)
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    xp INTEGER NOT NULL CHECK (xp >= 0),
    difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    evidence_required BOOLEAN DEFAULT FALSE,
    deadline DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Under Review', 'Completed', 'Archived')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Challenge Participation Table (GAM-1 / BR-5)
CREATE TABLE IF NOT EXISTS challenge_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL, -- references auth.users(id)
    progress VARCHAR(255),
    proof VARCHAR(255), -- file URL proof
    approval VARCHAR(50) DEFAULT 'Pending' CHECK (approval IN ('Pending', 'Under Review', 'Approved', 'Rejected')),
    xp_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(challenge_id, employee_id)
);

-- Policy Acknowledgement Table (GOV-2)
CREATE TABLE IF NOT EXISTS policy_acknowledgements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL, -- references auth.users(id)
    policy_id UUID REFERENCES esg_policies(id) ON DELETE CASCADE,
    acknowledged_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Acknowledged')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(employee_id, policy_id)
);

-- Audits Table (GOV-3)
CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_name VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    auditor VARCHAR(255) NOT NULL,
    findings TEXT,
    date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Completed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Compliance Issues Table (GOV-4 / BR-6)
CREATE TABLE IF NOT EXISTS compliance_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES audits(id) ON DELETE SET NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('High', 'Medium', 'Low')),
    description TEXT NOT NULL,
    owner_id UUID NOT NULL, -- references auth.users(id) or employee profile id
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Department ESG Scores Table (ENV-3)
CREATE TABLE IF NOT EXISTS department_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    environmental_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    social_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    governance_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    total_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    period VARCHAR(50) NOT NULL, -- e.g., 'Q2-2026' or '2026-07'
    created_at TIMESTAMPTZ DEFAULT now()
);


-- =====================================================================
-- 3. INDEXES FOR QUERY OPTIMIZATION
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_dept_parent ON departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_goal_dept ON environmental_goals(department_id);
CREATE INDEX IF NOT EXISTS idx_tx_dept ON carbon_transactions(department_id);
CREATE INDEX IF NOT EXISTS idx_tx_factor ON carbon_transactions(emission_factor_id);
CREATE INDEX IF NOT EXISTS idx_csr_category ON csr_activities(category_id);
CREATE INDEX IF NOT EXISTS idx_part_employee ON employee_participations(employee_id);
CREATE INDEX IF NOT EXISTS idx_part_activity ON employee_participations(activity_id);
CREATE INDEX IF NOT EXISTS idx_chal_category ON challenges(category_id);
CREATE INDEX IF NOT EXISTS idx_cp_employee ON challenge_participations(employee_id);
CREATE INDEX IF NOT EXISTS idx_ack_employee ON policy_acknowledgements(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_dept ON audits(department_id);
CREATE INDEX IF NOT EXISTS idx_ci_audit ON compliance_issues(audit_id);
CREATE INDEX IF NOT EXISTS idx_ci_owner ON compliance_issues(owner_id);
CREATE INDEX IF NOT EXISTS idx_scores_dept ON department_scores(department_id);


-- =====================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE emission_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_esg_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE environmental_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE esg_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE csr_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_scores ENABLE ROW LEVEL SECURITY;

-- Select/Read Policies (Available for Authenticated Users)
CREATE POLICY select_departments ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY select_categories ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY select_emission_factors ON emission_factors FOR SELECT TO authenticated USING (true);
CREATE POLICY select_product_profiles ON product_esg_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY select_goals ON environmental_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY select_policies ON esg_policies FOR SELECT TO authenticated USING (true);
CREATE POLICY select_badges ON badges FOR SELECT TO authenticated USING (true);
CREATE POLICY select_rewards ON rewards FOR SELECT TO authenticated USING (true);
CREATE POLICY select_transactions ON carbon_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY select_csr_activities ON csr_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY select_participations ON employee_participations FOR SELECT TO authenticated USING (true);
CREATE POLICY select_challenges ON challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY select_challenge_parts ON challenge_participations FOR SELECT TO authenticated USING (true);
CREATE POLICY select_policy_acks ON policy_acknowledgements FOR SELECT TO authenticated USING (true);
CREATE POLICY select_audits ON audits FOR SELECT TO authenticated USING (true);
CREATE POLICY select_compliance_issues ON compliance_issues FOR SELECT TO authenticated USING (true);
CREATE POLICY select_scores ON department_scores FOR SELECT TO authenticated USING (true);

-- Insert/Update Policies (Scope limits based on user ownership)
CREATE POLICY insert_participations ON employee_participations FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = employee_id);

CREATE POLICY insert_challenge_parts ON challenge_participations FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = employee_id);

CREATE POLICY insert_policy_acks ON policy_acknowledgements FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = employee_id);
