// EcoSphere Mock Data

const DEFAULT_MOCK_DATA = {
  departments: [
    { id: "dept-1", name: "Operations & Logistics", code: "OPS", head: "Marcus Vance", parentDepartment: null, employeeCount: 120, status: "Active" },
    { id: "dept-2", name: "Engineering & R&D", code: "ENG", head: "Emily Chen", parentDepartment: null, employeeCount: 85, status: "Active" },
    { id: "dept-3", name: "Facilities & Real Estate", code: "FAC", head: "Sarah Jenkins", parentDepartment: "dept-1", employeeCount: 30, status: "Active" },
    { id: "dept-4", name: "Sales & Marketing", code: "MKT", head: "David Kalu", parentDepartment: null, employeeCount: 65, status: "Active" },
    { id: "dept-5", name: "Human Resources", code: "HR", head: "Sophia Patel", parentDepartment: null, employeeCount: 15, status: "Active" }
  ],
  categories: [
    { id: "cat-1", name: "Energy & Climate", type: "Both", status: "Active" },
    { id: "cat-2", name: "Waste & Circularity", type: "Both", status: "Active" },
    { id: "cat-3", name: "Community & Diversity", type: "CSR Activity", status: "Active" },
    { id: "cat-4", name: "Sustainable Commute", type: "Challenge", status: "Active" },
    { id: "cat-5", name: "Governance & Ethics", type: "Both", status: "Active" }
  ],
  emissionFactors: [
    { id: "ef-1", category: "Electricity (Grid)", unit: "kWh", co2eFactor: 0.000385, effectiveDate: "2026-01-01", source: "EPA eGRID 2026", status: "Active" },
    { id: "ef-2", category: "Natural Gas", unit: "Therm", co2eFactor: 0.0053, effectiveDate: "2026-01-01", source: "EPA GHG Emission Factors", status: "Active" },
    { id: "ef-3", category: "Diesel Fuel (Fleet)", unit: "Liter", co2eFactor: 0.00268, effectiveDate: "2026-01-01", source: "EPA GHG Emission Factors", status: "Active" },
    { id: "ef-4", category: "Petrol/Gasoline (Fleet)", unit: "Liter", co2eFactor: 0.00231, effectiveDate: "2026-01-01", source: "EPA GHG Emission Factors", status: "Active" },
    { id: "ef-5", category: "Air Travel (Short Haul)", unit: "Passenger-km", co2eFactor: 0.000156, effectiveDate: "2026-01-01", source: "DEFRA 2025", status: "Active" },
    { id: "ef-6", category: "Air Travel (Long Haul)", unit: "Passenger-km", co2eFactor: 0.000102, effectiveDate: "2026-01-01", source: "DEFRA 2025", status: "Active" }
  ],
  productEsgProfiles: [
    { id: "prod-1", product: "EcoSphere Core Server Rack", linkedEmissionFactors: ["ef-1", "ef-3"], notes: "Includes assembly phase grid electricity and regional transport emissions.", status: "Active" },
    { id: "prod-2", product: "Standard Employee Office Kit", linkedEmissionFactors: ["ef-1"], notes: "Standardized average calculation based on typical laptop manufacturing energy.", status: "Active" }
  ],
  environmentalGoals: [
    { id: "goal-1", department: "dept-1", metric: "Fleet Diesel Consumption (Liters)", targetValue: 12000, currentValue: 14500, targetDate: "2026-12-31", status: "In Progress" },
    { id: "goal-2", department: "dept-2", metric: "Electricity usage (kWh)", targetValue: 45000, currentValue: 38200, targetDate: "2026-09-30", status: "In Progress" },
    { id: "goal-3", department: "dept-3", metric: "Waste Sent to Landfill (Tons)", targetValue: 2, currentValue: 1.8, targetDate: "2026-08-31", status: "In Progress" },
    { id: "goal-4", department: "dept-4", metric: "Business Travel Emissions (tCO2e)", targetValue: 15, currentValue: 18.5, targetDate: "2026-12-31", status: "In Progress" }
  ],
  esgPolicies: [
    { id: "pol-1", title: "Corporate Code of Business Conduct & Ethics", description: "Defines organizational principles, anti-bribery regulations, conflict of interest management, and whistleblowing protections.", category: "Governance & Ethics", version: "v2.1", effectiveDate: "2026-01-15", status: "Published" },
    { id: "pol-2", title: "Environmental & Sustainable Sourcing Policy", description: "Guidelines for zero-waste production, eco-friendly procurement standards, carbon emissions reductions, and supplier sustainability assessments.", category: "Energy & Climate", version: "v1.4", effectiveDate: "2026-03-01", status: "Published" },
    { id: "pol-3", title: "Workplace Inclusion & Equal Opportunity Policy", description: "Outlines diversity hiring targets, non-discrimination clauses, harassment reporting guidelines, and flexible workplace support programs.", category: "Community & Diversity", version: "v3.0", effectiveDate: "2026-02-10", status: "Published" },
    { id: "pol-4", title: "Information Security, Privacy & Data Protection Policy", description: "Sets guidelines for handling customer/employee data, remote work cybersecurity procedures, encryption, and password updates.", category: "Governance & Ethics", version: "v2.0", effectiveDate: "2026-04-01", status: "Published" }
  ],
  badges: [
    { id: "badge-1", name: "Carbon Cutter", description: "Awarded for completing at least 3 Sustainable Commute challenges.", unlockRule: "challenges:cat-4:3", icon: "🌱" },
    { id: "badge-2", name: "CSR Leader", description: "Earn a total of 500 CSR XP through volunteering activities.", unlockRule: "xp:500", icon: "🤝" },
    { id: "badge-3", name: "Compliance Scholar", description: "Acknowledge 100% of the published corporate governance policies.", unlockRule: "policies:all", icon: "📜" },
    { id: "badge-4", name: "Zero Waste Hero", description: "Complete the Waste & Circularity challenge.", unlockRule: "challenges:cat-2:1", icon: "♻️" },
    { id: "badge-5", name: "Eco Ambassador", description: "Achieve Level 5 or higher in the employee registry.", unlockRule: "level:5", icon: "👑" }
  ],
  rewards: [
    { id: "rew-1", name: "Premium Solar Power Bank", description: "10,000mAh solar-charging power bank made from recycled ocean plastic.", pointsRequired: 300, stock: 12, status: "Active" },
    { id: "rew-2", name: "Organic Bamboo Desktop Organizer", description: "Sleek, minimalist organizer for pens, phone, and accessories.", pointsRequired: 150, stock: 25, status: "Active" },
    { id: "rew-3", name: "Plant-a-Tree Contribution (5 Trees)", description: "Plant 5 native trees in a reforestation reserve. Receives official certificate.", pointsRequired: 100, stock: 999, status: "Active" },
    { id: "rew-4", name: "Reusable Insulation Travel Mug", description: "Double-walled vacuum insulated bottle keeping drinks hot/cold for 12h.", pointsRequired: 200, stock: 5, status: "Active" },
    { id: "rew-5", name: "Paid Environmental Volunteering Half-Day", description: "Half-day paid time off to participate in environmental conservation work.", pointsRequired: 500, stock: 10, status: "Active" }
  ],
  carbonTransactions: [
    { id: "tx-1", sourceRecord: "PO-2026-0041 (Ops Electricity)", department: "dept-1", emissionFactor: "ef-1", quantity: 45000, calculatedCo2e: 17.325, date: "2026-06-15", calculationMethod: "Auto" },
    { id: "tx-2", sourceRecord: "FLT-MKT-881 (Sales Air Travel)", department: "dept-4", emissionFactor: "ef-6", quantity: 68000, calculatedCo2e: 6.936, date: "2026-06-20", calculationMethod: "Auto" },
    { id: "tx-3", sourceRecord: "MFG-ENG-082 (R&D Natural Gas)", department: "dept-2", emissionFactor: "ef-2", quantity: 1800, calculatedCo2e: 9.54, date: "2026-06-25", calculationMethod: "Auto" },
    { id: "tx-4", sourceRecord: "FLT-OPS-912 (Operations Fleet)", department: "dept-1", emissionFactor: "ef-3", quantity: 3500, calculatedCo2e: 9.38, date: "2026-07-02", calculationMethod: "Auto" },
    { id: "tx-5", sourceRecord: "EXP-HR-004 (HR Electricity Override)", department: "dept-5", emissionFactor: "ef-1", quantity: 4500, calculatedCo2e: 1.732, date: "2026-07-05", calculationMethod: "Manual" }
  ],
  csrActivities: [
    { id: "csr-1", title: "Local Shoreline Clean-up Drive", category: "cat-2", description: "Join our facilities crew at the municipal reserve to pick up plastic waste and restore coastal pathways.", xp: 150, difficulty: "Medium", evidenceRequired: true, deadline: "2026-07-20", status: "Active" },
    { id: "csr-2", title: "STEM Mentorship for Local Underrepresented Schools", category: "cat-3", description: "Provide 2 hours of virtual coding tutorials or engineering mentorship to local high school students.", xp: 200, difficulty: "Hard", evidenceRequired: true, deadline: "2026-08-15", status: "Active" },
    { id: "csr-3", title: "E-Waste Recycling Drop-off", category: "cat-2", description: "Gather unused domestic cords, old phones, and batteries, and deposit them in the lobby recycling collection bins.", xp: 50, difficulty: "Easy", evidenceRequired: false, deadline: "2026-07-15", status: "Active" },
    { id: "csr-4", title: "Community Food Bank Packaging Day", category: "cat-3", description: "Sort and box incoming food donations at the central city food bank warehouse.", xp: 120, difficulty: "Medium", evidenceRequired: true, deadline: "2026-07-10", status: "Completed" }
  ],
  employeeParticipations: [
    { id: "part-1", employee: "Marcus Vance", activity: "csr-4", proof: "marcus_foodbank_log.jpg", approvalStatus: "Approved", pointsEarned: 120, completionDate: "2026-07-09" },
    { id: "part-2", employee: "Sarah Jenkins", activity: "csr-3", proof: "", approvalStatus: "Approved", pointsEarned: 50, completionDate: "2026-07-11" },
    { id: "part-3", employee: "Emily Chen", activity: "csr-1", proof: "shoreline_trash_bag.jpg", approvalStatus: "Under Review", pointsEarned: 150, completionDate: "2026-07-12" }
  ],
  challenges: [
    { id: "chal-1", title: "Commute Carbon Free (1 Week)", category: "cat-4", description: "Walk, cycle, carpool, or take public transit to work for 5 consecutive business days. Post a log/screenshot of your commute transit app.", xp: 250, difficulty: "Medium", evidenceRequired: true, deadline: "2026-07-18", status: "Active" },
    { id: "chal-2", title: "Zero Single-Use Plastic at Work", category: "cat-2", description: "Avoid purchasing single-use water bottles, plastic cups, and utensils for two weeks. Log photos of your reusable setups.", xp: 300, difficulty: "Medium", evidenceRequired: true, deadline: "2026-07-28", status: "Active" },
    { id: "chal-3", title: "Complete ESG Cyber Ethics Training", category: "cat-5", description: "Go through the interactive ESG Ethics slide deck in the HR portal and submit your completion code.", xp: 100, difficulty: "Easy", evidenceRequired: false, deadline: "2026-07-30", status: "Active" }
  ],
  challengeParticipations: [
    { id: "cp-1", challenge: "chal-1", employee: "Sarah Jenkins", progress: "4/5 Days Completed", proof: "transit_ticket_stamps.pdf", approval: "Under Review", xpAwarded: 0 },
    { id: "cp-2", challenge: "chal-3", employee: "David Kalu", progress: "100% Completed", proof: "", approval: "Approved", xpAwarded: 100 }
  ],
  policyAcknowledgements: [
    { id: "ack-1", employee: "Sarah Jenkins", policy: "pol-1", acknowledgedDate: "2026-01-20", status: "Acknowledged" },
    { id: "ack-2", employee: "Sarah Jenkins", policy: "pol-2", acknowledgedDate: "2026-03-05", status: "Acknowledged" },
    { id: "ack-3", employee: "Sarah Jenkins", policy: "pol-4", acknowledgedDate: "2026-04-10", status: "Acknowledged" },
    { id: "ack-4", employee: "Marcus Vance", policy: "pol-1", acknowledgedDate: "2026-01-18", status: "Acknowledged" },
    { id: "ack-5", employee: "Marcus Vance", policy: "pol-2", acknowledgedDate: "2026-03-12", status: "Acknowledged" }
  ],
  audits: [
    { id: "aud-1", auditName: "Q2 HQ Waste Audit", department: "dept-3", auditor: "EcoGuard Auditing Group", findings: "Satisfactory separation of organic wastes observed, but recycling bins in Engineering contained minor plastics contaminations. Total landfill volume down 8% compared to Q1.", date: "2026-06-10", status: "Completed" },
    { id: "aud-2", auditName: "HR Diversity & Equal Opportunity Audit", department: "dept-5", auditor: "Sovereign ESG Compliance", findings: "Gender pay parity stands at 1:0.98. Recruitment outreach targets for minority communities successfully met at 105%. Recommendations focus on leadership mentoring tracks.", date: "2026-05-18", status: "Completed" },
    { id: "aud-3", auditName: "Anti-Bribery Policy Review", department: "dept-1", auditor: "Global Integrity LLC", findings: "Training logs reviewed. Two supplier registry issues noted with missing signed ethics agreements.", date: "2026-07-01", status: "Completed" }
  ],
  complianceIssues: [
    { id: "ci-1", audit: "aud-3", severity: "High", description: "Missing signed supplier ethics statements for regional parts contractor (Alpha Services).", owner: "Marcus Vance", dueDate: "2026-07-10", status: "Open" },
    { id: "ci-2", audit: "aud-1", severity: "Medium", description: "Engineering bin contaminate issues. Signage and additional sorting containers required in Annex 2.", owner: "Sarah Jenkins", dueDate: "2026-07-25", status: "Open" },
    { id: "ci-3", audit: "aud-2", severity: "Low", description: "Set up scheduling matrix for minority mentorship program in Engineering.", owner: "Sophia Patel", dueDate: "2026-08-30", status: "Open" }
  ],
  employees: [
    { name: "Sarah Jenkins", role: "Facilities Manager", department: "dept-3", xp: 450, points: 350, level: 3, badges: ["badge-3"] },
    { name: "Marcus Vance", role: "Logistics Lead", department: "dept-1", xp: 1200, points: 800, level: 5, badges: ["badge-2", "badge-5"] },
    { name: "Emily Chen", role: "Principal Engineer", department: "dept-2", xp: 550, points: 250, level: 4, badges: ["badge-4"] },
    { name: "David Kalu", role: "Marketing Director", department: "dept-4", xp: 380, points: 180, level: 2, badges: [] },
    { name: "Sophia Patel", role: "HR Generalist", department: "dept-5", xp: 910, points: 500, level: 4, badges: ["badge-2", "badge-3"] }
  ],
  esgConfiguration: {
    weights: {
      environmental: 40,
      social: 30,
      governance: 30
    },
    toggles: {
      autoCalc: true,
      evidenceRequired: true,
      badgeAutoAward: true
    }
  },
  notifications: [
    { id: "notif-1", message: "Compliance issue raised: Missing signed supplier ethics statements (Marcus Vance).", date: "2026-07-01", type: "compliance", read: false },
    { id: "notif-2", message: "CSR Participation approved for Marcus Vance in Community Food Bank Packaging Day (+120 XP).", date: "2026-07-09", type: "csr", read: true },
    { id: "notif-3", message: "Policy published: Information Security, Privacy & Data Protection Policy. Acknowledgment requested.", date: "2026-04-01", type: "policy", read: false }
  ]
};
