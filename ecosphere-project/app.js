// EcoSphere - Application Engine

// Global State
let state = {};

// Current Employee Profile
const CURRENT_EMPLOYEE_NAME = "Sarah Jenkins";

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  initState();
  initRouting();
  initTheme();
  renderAll();
  setupEventListeners();
  checkOverdueComplianceIssues();
});

// Load state from local storage or mock data
function initState() {
  const savedState = localStorage.getItem("ecosphere_state");
  if (savedState) {
    state = JSON.parse(savedState);
  } else {
    // DEFAULT_MOCK_DATA comes from mock_data.js
    state = JSON.parse(JSON.stringify(DEFAULT_MOCK_DATA));
    saveState();
  }
}

// Save state to local storage and recalculate scores
function saveState() {
  localStorage.setItem("ecosphere_state", JSON.stringify(state));
}

// Theme management
function initTheme() {
  const currentTheme = localStorage.getItem("ecosphere_theme") || "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("ecosphere_theme", newTheme);
  
  const icon = document.querySelector(".theme-toggle-btn svg");
  if (newTheme === "light") {
    icon.innerHTML = '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 7a5 5 0 100 10 5 5 0 000-10z"></path>';
  } else {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>';
  }
}

// Tabs Routing
function initRouting() {
  const sidebarLinks = document.querySelectorAll(".nav-links li");
  sidebarLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tabId = link.getAttribute("data-tab");
      switchTab(tabId);
    });
  });
  
  // Set default tab
  switchTab("overview");
}

function switchTab(tabId) {
  // Update nav menu UI
  document.querySelectorAll(".nav-links li").forEach(li => {
    if (li.getAttribute("data-tab") === tabId) {
      li.classList.add("active");
    } else {
      li.classList.remove("active");
    }
  });

  // Switch tab display
  document.querySelectorAll(".tab-content").forEach(content => {
    if (content.id === `${tabId}-tab`) {
      content.classList.add("active");
    } else {
      content.classList.remove("active");
    }
  });
  
  // Context-specific updates on tab activation
  if (tabId === "overview") {
    renderOverview();
  } else if (tabId === "environmental") {
    renderEnvironmental();
  } else if (tabId === "social") {
    renderSocial();
  } else if (tabId === "governance") {
    renderGovernance();
  } else if (tabId === "gamification") {
    renderGamification();
  } else if (tabId === "reports") {
    runReportFilter(); // Initial reporting render
  } else if (tabId === "settings") {
    renderSettings();
  }
}

// Notification Drawer Toggle
function toggleNotifications() {
  const drawer = document.getElementById("notification-drawer");
  drawer.classList.toggle("active");
  
  // Mark all notifications as read when opening drawer
  if (drawer.classList.contains("active")) {
    state.notifications.forEach(n => n.read = true);
    saveState();
    renderHeaderWidgets();
    renderNotificationsList();
  }
}

// -------------------------------------------------------------
// Scoring Engine Logic
// -------------------------------------------------------------

function calculateESGScore() {
  // 1. Environmental Score (out of 100)
  // Carbon intensity baseline vs current progress.
  // Calculated: starting with baseline of 80. Subtract 0.5 points per Metric Ton of CO2e in transactions.
  // Add 5 points per environmental goal currently met (current <= target).
  let envScore = 80;
  const totalCo2e = state.carbonTransactions.reduce((acc, curr) => acc + curr.calculatedCo2e, 0);
  envScore -= totalCo2e * 0.4;
  
  // Target achievements impact
  state.environmentalGoals.forEach(g => {
    if (g.currentValue <= g.targetValue) {
      envScore += 4;
    } else {
      envScore -= 2;
    }
  });
  
  envScore = Math.max(0, Math.min(100, Math.round(envScore)));

  // 2. Social Score (out of 100)
  // Based on approved CSR participations and completed challenges.
  // Base score 45. Add 5 pts per approved CSR Activity, 10 pts per approved Challenge.
  let socialScore = 45;
  const approvedCsrCount = state.employeeParticipations.filter(p => p.approvalStatus === "Approved").length;
  const approvedChalCount = state.challengeParticipations.filter(p => p.approval === "Approved").length;
  
  socialScore += approvedCsrCount * 6;
  socialScore += approvedChalCount * 12;
  
  socialScore = Math.max(0, Math.min(100, Math.round(socialScore)));

  // 3. Governance Score (out of 100)
  // Base 100. Deduct points for open compliance issues: High (15), Med (8), Low (4).
  // Add points for policy acknowledgement rates: (acknowledged/total) * 20.
  let govScore = 80;
  
  const openIssues = state.complianceIssues.filter(i => i.status === "Open");
  openIssues.forEach(issue => {
    if (issue.severity === "High") govScore -= 12;
    else if (issue.severity === "Medium") govScore -= 7;
    else if (issue.severity === "Low") govScore -= 3;
  });

  // Policy completion rate impact
  const totalPolicies = state.esgPolicies.filter(p => p.status === "Published").length;
  const activeEmployees = state.employees.length;
  const totalExpectedAcks = totalPolicies * activeEmployees;
  const actualAcksCount = state.policyAcknowledgements.filter(a => a.status === "Acknowledged").length;
  
  const ackPercentage = totalExpectedAcks > 0 ? (actualAcksCount / totalExpectedAcks) : 1;
  govScore += ackPercentage * 20;
  
  govScore = Math.max(0, Math.min(100, Math.round(govScore)));

  // 4. Weights Configuration & Total score
  const w = state.esgConfiguration.weights;
  const totalScore = Math.round(
    (envScore * (w.environmental / 100)) + 
    (socialScore * (w.social / 100)) + 
    (govScore * (w.governance / 100))
  );

  return {
    environmental: envScore,
    social: socialScore,
    governance: govScore,
    total: totalScore
  };
}

// -------------------------------------------------------------
// Toast Messages
// -------------------------------------------------------------
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let icon = "💡";
  if (type === "success") icon = "✅";
  else if (type === "error") icon = "❌";
  else if (type === "warning") icon = "⚠️";
  
  toast.innerHTML = `
    <div>${icon}</div>
    <div class="toast-msg">${message}</div>
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px) scale(0.9)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// -------------------------------------------------------------
// Notifications Stack
// -------------------------------------------------------------
function addNotification(message, type = "info") {
  const newNotif = {
    id: `notif-${Date.now()}`,
    message: message,
    date: new Date().toISOString().split("T")[0],
    type: type,
    read: false
  };
  state.notifications.unshift(newNotif);
  saveState();
  renderHeaderWidgets();
  renderNotificationsList();
  
  // Trigger system notification alert
  showToast(message, type === "compliance" ? "warning" : "info");
}

// Check if any Open Compliance Issues are overdue
function checkOverdueComplianceIssues() {
  const today = new Date().toISOString().split("T")[0];
  let updated = false;
  
  state.complianceIssues.forEach(issue => {
    if (issue.status === "Open" && issue.dueDate < today) {
      // Check if we already notified about this overdue issue
      const notifMsg = `Compliance Issue Overdue: "${issue.description}" owned by ${issue.owner}.`;
      const alreadyNotified = state.notifications.some(n => n.message === notifMsg);
      if (!alreadyNotified) {
        addNotification(notifMsg, "compliance");
        updated = true;
      }
    }
  });
  
  if (updated) {
    saveState();
    renderAll();
  }
}

// -------------------------------------------------------------
// Gamification Engine (Badges, Rewards, XP)
// -------------------------------------------------------------

// Award XP & Points to an employee
function awardEmployeeXP(employeeName, amount) {
  const emp = state.employees.find(e => e.name === employeeName);
  if (!emp) return;
  
  emp.xp += amount;
  emp.points += amount; // Earned points matches XP gained
  
  // Calculate Levels (Level 1: 0-199 XP, Level 2: 200-499 XP, Level 3: 500-899 XP, Level 4: 900-1499 XP, Level 5: 1500+ XP)
  let oldLevel = emp.level;
  if (emp.xp >= 1500) emp.level = 5;
  else if (emp.xp >= 900) emp.level = 4;
  else if (emp.xp >= 500) emp.level = 3;
  else if (emp.xp >= 200) emp.level = 2;
  else emp.level = 1;
  
  if (emp.level > oldLevel) {
    addNotification(`Congratulations! ${employeeName} leveled up to Level ${emp.level}! 👑`, "gamification");
    showToast(`${employeeName} leveled up to Level ${emp.level}!`, "success");
  }
  
  // Check badge awards automatically if enabled
  if (state.esgConfiguration.toggles.badgeAutoAward) {
    checkAndAwardBadges(employeeName);
  }
  
  saveState();
  renderHeaderWidgets();
  renderGamification();
}

// BR-5: Badge Auto-Award Checker
function checkAndAwardBadges(employeeName) {
  const emp = state.employees.find(e => e.name === employeeName);
  if (!emp) return;
  
  state.badges.forEach(badge => {
    // Skip if already unlocked
    if (emp.badges.includes(badge.id)) return;
    
    let unlocked = false;
    const rule = badge.unlockRule; // Rule format examples: "xp:500", "challenges:cat-4:3", "policies:all", "level:5"
    const parts = rule.split(":");
    
    if (parts[0] === "xp") {
      const requiredXp = parseInt(parts[1]);
      if (emp.xp >= requiredXp) unlocked = true;
    } 
    else if (parts[0] === "level") {
      const requiredLevel = parseInt(parts[1]);
      if (emp.level >= requiredLevel) unlocked = true;
    }
    else if (parts[0] === "policies" && parts[1] === "all") {
      const publishedCount = state.esgPolicies.filter(p => p.status === "Published").length;
      const ackCount = state.policyAcknowledgements.filter(a => a.employee === employeeName && a.status === "Acknowledged").length;
      if (publishedCount > 0 && ackCount >= publishedCount) unlocked = true;
    }
    else if (parts[0] === "challenges") {
      const catId = parts[1];
      const countNeeded = parseInt(parts[2]);
      
      // Get all approved challenge participations for this employee
      const approvedChals = state.challengeParticipations.filter(cp => {
        if (cp.employee !== employeeName || cp.approval !== "Approved") return false;
        // Lookup challenge category
        const chal = state.challenges.find(c => c.id === cp.challenge);
        return chal && chal.category === catId;
      });
      
      if (approvedChals.length >= countNeeded) unlocked = true;
    }
    
    if (unlocked) {
      emp.badges.push(badge.id);
      addNotification(`Badge Unlocked: ${badge.name} earned by ${employeeName}! ${badge.icon}`, "gamification");
      showToast(`Earned "${badge.name}" Badge! ${badge.icon}`, "success");
    }
  });
}

// BR-1: Reward Redemption Handler
function redeemReward(rewardId) {
  const reward = state.rewards.find(r => r.id === rewardId);
  if (!reward) return;
  
  // Find current employee state
  const emp = state.employees.find(e => e.name === CURRENT_EMPLOYEE_NAME);
  if (!emp) return;
  
  if (reward.stock <= 0) {
    showToast(`Sorry, ${reward.name} is currently out of stock.`, "error");
    return;
  }
  
  if (emp.points < reward.pointsRequired) {
    showToast(`Insufficient points! You need ${reward.pointsRequired} points (current balance: ${emp.points}).`, "error");
    return;
  }
  
  // Transaction processing
  reward.stock -= 1;
  emp.points -= reward.pointsRequired;
  
  addNotification(`Reward redeemed: ${CURRENT_EMPLOYEE_NAME} purchased "${reward.name}" for ${reward.pointsRequired} Points.`, "gamification");
  showToast(`Successfully redeemed ${reward.name}!`, "success");
  
  saveState();
  renderHeaderWidgets();
  renderGamification();
}

// -------------------------------------------------------------
// Component Render Functions
// -------------------------------------------------------------

function renderAll() {
  renderHeaderWidgets();
  renderNotificationsList();
  
  // Render active tab only
  const activeLi = document.querySelector(".nav-links li.active");
  if (activeLi) {
    switchTab(activeLi.getAttribute("data-tab"));
  }
}

// Render header widgets (ESG score badge, Level, Points, Notification counter)
function renderHeaderWidgets() {
  const scores = calculateESGScore();
  
  // ESG badge in header
  const esgValEl = document.getElementById("header-esg-value");
  if (esgValEl) esgValEl.textContent = scores.total;
  
  // Notification bell badge
  const unreadCount = state.notifications.filter(n => !n.read).length;
  const bellBadge = document.getElementById("header-notif-count");
  if (bellBadge) {
    if (unreadCount > 0) {
      bellBadge.textContent = unreadCount;
      bellBadge.style.display = "flex";
    } else {
      bellBadge.style.display = "none";
    }
  }
  
  // Logged-in employee details in sidebar footer
  const emp = state.employees.find(e => e.name === CURRENT_EMPLOYEE_NAME);
  if (emp) {
    const avatar = document.getElementById("sidebar-user-avatar");
    const nameEl = document.getElementById("sidebar-user-name");
    const roleEl = document.getElementById("sidebar-user-role");
    
    if (avatar) avatar.textContent = emp.name.split(" ").map(n => n[0]).join("");
    if (nameEl) nameEl.innerHTML = `${emp.name} <span class="level-badge">Lvl ${emp.level}</span>`;
    if (roleEl) roleEl.textContent = `${emp.role} (${emp.points} pts)`;
  }
}

// Render Notifications in the drawer
function renderNotificationsList() {
  const notifListEl = document.getElementById("drawer-notifications-list");
  if (!notifListEl) return;
  
  if (state.notifications.length === 0) {
    notifListEl.innerHTML = '<div style="text-align:center; padding: 20px; color:var(--text-secondary);">No notifications yet.</div>';
    return;
  }
  
  notifListEl.innerHTML = state.notifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}">
      <div class="notif-msg">${n.message}</div>
      <div class="notif-time">${n.date}</div>
    </div>
  `).join("");
}

// Overview / Dashboard Render
function renderOverview() {
  const scores = calculateESGScore();
  
  // Overdue Issue Alert Banner
  const alertContainer = document.getElementById("overdue-alerts-container");
  const overdueIssues = state.complianceIssues.filter(i => i.status === "Open" && i.dueDate < new Date().toISOString().split("T")[0]);
  
  if (overdueIssues.length > 0) {
    alertContainer.innerHTML = `
      <div class="alert-banner">
        <span>⚠️ Warning: There are ${overdueIssues.length} overdue compliance issues requiring immediate action.</span>
        <span class="alert-action" onclick="switchTab('governance')">View Issues</span>
      </div>
    `;
  } else {
    alertContainer.innerHTML = "";
  }
  
  // Render Circular Scoring Gauges
  updateGauge("gauge-total", scores.total);
  updateGauge("gauge-env", scores.environmental);
  updateGauge("gauge-soc", scores.social);
  updateGauge("gauge-gov", scores.governance);
  
  // Render Environmental Goal Progress Overview (Top 3)
  const envGoalsOverview = document.getElementById("dashboard-goals-list");
  if (envGoalsOverview) {
    const goalsSlice = state.environmentalGoals.slice(0, 3);
    envGoalsOverview.innerHTML = goalsSlice.map(g => {
      const dept = state.departments.find(d => d.id === g.department);
      const percentage = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
      const displayClass = percentage > 100 ? 'danger' : 'success';
      const isComplete = g.currentValue <= g.targetValue ? '✅ Under Target' : '⚠️ Over Target';
      
      return `
        <div class="goal-item">
          <div class="goal-info">
            <span><strong>${dept ? dept.name : "Dept"}</strong>: ${g.metric}</span>
            <span class="status-pill ${displayClass}">${g.currentValue} / ${g.targetValue}</span>
          </div>
          <div class="progress-container">
            <div class="progress-fill" style="width: ${percentage}%; background-color: var(--color-${displayClass === 'danger' ? 'danger' : 'success'});"></div>
          </div>
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px; display:flex; justify-content:space-between;">
            <span>Target Date: ${g.targetDate}</span>
            <span>${isComplete}</span>
          </div>
        </div>
      `;
    }).join("");
  }
  
  // Render Social / Gamification leaderboards (Top 4 employees by XP)
  const leaderboardEl = document.getElementById("dashboard-leaderboard");
  if (leaderboardEl) {
    const sortedEmployees = [...state.employees].sort((a,b) => b.xp - a.xp).slice(0, 4);
    leaderboardEl.innerHTML = sortedEmployees.map((e, index) => {
      const dept = state.departments.find(d => d.id === e.department);
      return `
        <div class="leaderboard-item">
          <div class="leaderboard-left">
            <span class="leaderboard-rank rank-${index+1}">${index+1}</span>
            <div>
              <div class="leaderboard-name">${e.name}</div>
              <div class="leaderboard-dept">${dept ? dept.name : ""}</div>
            </div>
          </div>
          <div class="leaderboard-right">
            <span>${e.xp}</span> <span style="font-size: 0.75rem; color: var(--text-secondary);">XP</span>
          </div>
        </div>
      `;
    }).join("");
  }
  
  // Render carbon breakdown chart (Visual SVG or dynamic bar)
  renderCarbonBreakdownChart();
}

function updateGauge(gaugeId, value) {
  const fill = document.getElementById(`${gaugeId}-fill`);
  const valText = document.getElementById(`${gaugeId}-val`);
  if (!fill || !valText) return;
  
  // Radial circumference = 2 * PI * r = 2 * 3.14159 * 50 = 314
  const circumference = 314;
  const offset = circumference - (value / 100) * circumference;
  
  fill.style.strokeDasharray = circumference;
  fill.style.strokeDashoffset = offset;
  valText.textContent = value;
}

function renderCarbonBreakdownChart() {
  const chartEl = document.getElementById("carbon-breakdown-chart");
  if (!chartEl) return;
  
  // Group emissions by department
  const emissionsByDept = {};
  state.departments.forEach(d => {
    emissionsByDept[d.id] = 0;
  });
  
  state.carbonTransactions.forEach(tx => {
    if (emissionsByDept[tx.department] !== undefined) {
      emissionsByDept[tx.department] += tx.calculatedCo2e;
    }
  });
  
  // Find maximum emissions for scaling
  const values = Object.values(emissionsByDept);
  const maxVal = Math.max(...values, 10);
  
  chartEl.innerHTML = `
    <div class="chart-axis-y">
      <span>${maxVal.toFixed(1)}t</span>
      <span>${(maxVal/2).toFixed(1)}t</span>
      <span>0t</span>
    </div>
    ${state.departments.map(d => {
      const val = emissionsByDept[d.id] || 0;
      const heightPercent = (val / maxVal) * 80; // max height 80%
      return `
        <div class="chart-bar-wrapper">
          <div class="chart-bar env-bar" style="height: ${heightPercent}%;">
            <span class="chart-bar-tooltip">${val.toFixed(2)} tCO2e</span>
          </div>
          <span class="chart-label">${d.code}</span>
        </div>
      `;
    }).join("")}
  `;
}

// Environmental Tab Render
function renderEnvironmental() {
  // 1. Emission Factors Manager
  const efTable = document.getElementById("ef-factors-table");
  if (efTable) {
    efTable.innerHTML = state.emissionFactors.map(ef => `
      <tr>
        <td><strong>${ef.category}</strong></td>
        <td>${ef.unit}</td>
        <td>${ef.co2eFactor}</td>
        <td>${ef.effectiveDate}</td>
        <td><span style="font-size:0.75rem; color:var(--text-secondary);">${ef.source}</span></td>
        <td><span class="status-pill success">${ef.status}</span></td>
      </tr>
    `).join("");
  }
  
  // Update Emission Factor Dropdown in Carbon form
  const efDropdown = document.getElementById("tx-ef-factor");
  if (efDropdown) {
    efDropdown.innerHTML = state.emissionFactors.map(ef => `
      <option value="${ef.id}" data-factor="${ef.co2eFactor}">${ef.category} (${ef.co2eFactor} tCO2e/${ef.unit})</option>
    `).join("");
  }
  
  // Update Department Dropdown in Carbon form
  const deptDropdown = document.getElementById("tx-department");
  if (deptDropdown) {
    deptDropdown.innerHTML = state.departments.map(d => `
      <option value="${d.id}">${d.name}</option>
    `).join("");
  }

  // 2. Carbon Transactions Log
  const txTable = document.getElementById("carbon-transactions-table");
  if (txTable) {
    txTable.innerHTML = state.carbonTransactions.map(tx => {
      const dept = state.departments.find(d => d.id === tx.department);
      const ef = state.emissionFactors.find(e => e.id === tx.emissionFactor);
      
      return `
        <tr>
          <td><strong>${tx.sourceRecord}</strong></td>
          <td>${dept ? dept.name : "Unknown"}</td>
          <td>${ef ? ef.category : "Unknown"}</td>
          <td>${tx.quantity.toLocaleString()}</td>
          <td><strong>${tx.calculatedCo2e.toFixed(3)} t</strong></td>
          <td>${tx.date}</td>
          <td><span class="status-pill info">${tx.calculationMethod}</span></td>
        </tr>
      `;
    }).join("");
  }
  
  // 3. Sustainability Goals List (Full details)
  const goalsTable = document.getElementById("goals-table-body");
  if (goalsTable) {
    goalsTable.innerHTML = state.environmentalGoals.map(g => {
      const dept = state.departments.find(d => d.id === g.department);
      const percentage = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
      const statusClass = g.currentValue <= g.targetValue ? "success" : "danger";
      
      return `
        <tr>
          <td><strong>${dept ? dept.name : "Unknown"}</strong></td>
          <td>${g.metric}</td>
          <td>${g.targetValue.toLocaleString()}</td>
          <td>${g.currentValue.toLocaleString()}</td>
          <td>
            <div style="display:flex; align-items:center; gap: 8px;">
              <div class="progress-container" style="width: 100px;">
                <div class="progress-fill" style="width: ${percentage}%; background-color: var(--color-${statusClass === 'danger' ? 'danger' : 'success'});"></div>
              </div>
              <span>${percentage}%</span>
            </div>
          </td>
          <td>${g.targetDate}</td>
          <td><span class="status-pill ${statusClass === 'success' ? 'success' : 'danger'}">${g.currentValue <= g.targetValue ? 'Under Limit' : 'Exceeded'}</span></td>
        </tr>
      `;
    }).join("");
  }
}

// Social Tab Render
function renderSocial() {
  // 1. CSR activities grid
  const csrGrid = document.getElementById("csr-activities-grid");
  if (csrGrid) {
    csrGrid.innerHTML = state.csrActivities.map(csr => {
      const cat = state.categories.find(c => c.id === csr.category);
      
      return `
        <div class="card challenge-card">
          <div>
            <div class="challenge-header">
              <span class="status-pill info">${cat ? cat.name : "Category"}</span>
              <span class="challenge-badge difficulty-${csr.difficulty.toLowerCase()}">${csr.difficulty}</span>
            </div>
            <h3 class="reward-title">${csr.title}</h3>
            <p class="reward-desc" style="margin-top:8px;">${csr.description}</p>
          </div>
          <div>
            <div class="challenge-meta-info">
              <span>Deadline: <strong>${csr.deadline}</strong></span>
              <span class="challenge-xp-badge">+${csr.xp} XP / Pts</span>
            </div>
            <button class="btn btn-sm btn-soc" style="width:100%; margin-top:16px; justify-content:center;" onclick="openCSRSubmissionModal('${csr.id}')">Log Participation</button>
          </div>
        </div>
      `;
    }).join("");
  }
  
  // Populate activities list in CSR Log dropdown
  const csrDropdown = document.getElementById("log-csr-id");
  if (csrDropdown) {
    csrDropdown.innerHTML = state.csrActivities.filter(a => a.status === "Active").map(a => `
      <option value="${a.id}">${a.title} (+${a.xp} XP)</option>
    `).join("");
  }
  
  // 2. Submissions / Participations Log Board
  const submissionsTable = document.getElementById("social-submissions-table");
  if (submissionsTable) {
    submissionsTable.innerHTML = state.employeeParticipations.map(p => {
      const act = state.csrActivities.find(a => a.id === p.activity);
      const isUnderReview = p.approvalStatus === "Under Review";
      
      let approvalAction = "";
      if (isUnderReview) {
        approvalAction = `
          <div style="display:flex; gap: 4px;">
            <button class="btn btn-sm btn-env" onclick="approveCSRParticipation('${p.id}', true)">Approve</button>
            <button class="btn btn-sm btn-sm" style="border-color:var(--color-danger); color:var(--color-danger);" onclick="approveCSRParticipation('${p.id}', false)">Reject</button>
          </div>
        `;
      } else {
        approvalAction = `<span class="status-pill ${p.approvalStatus === 'Approved' ? 'success' : 'danger'}">${p.approvalStatus}</span>`;
      }
      
      return `
        <tr>
          <td><strong>${p.employee}</strong></td>
          <td>${act ? act.title : "Unknown CSR Activity"}</td>
          <td><span style="font-size:0.75rem; color:var(--text-secondary);">${p.proof || 'No proof file'}</span></td>
          <td>${p.completionDate}</td>
          <td><strong>+${p.pointsEarned}</strong></td>
          <td>${approvalAction}</td>
        </tr>
      `;
    }).join("");
  }
  
  // 3. Render Diversity Metrics and Training stats (Dynamic visual lists)
  const trainingProgressList = document.getElementById("social-training-list");
  if (trainingProgressList) {
    // Generate a static beautiful list of ESG trainings
    const trainings = [
      { name: "ESG Corporate Governance Foundations", rate: 92, status: "Active" },
      { name: "Safety & Hazardous Waste Minimization", rate: 85, status: "Active" },
      { name: "Diversity & Anti-Bias Workplace Alignment", rate: 100, status: "Completed" },
      { name: "Carbon Accounting Methods for Leads", rate: 64, status: "In Progress" }
    ];
    trainingProgressList.innerHTML = trainings.map(t => `
      <div class="goal-item">
        <div class="goal-info">
          <span>${t.name}</span>
          <span><strong>${t.rate}% Complete</strong></span>
        </div>
        <div class="progress-container">
          <div class="progress-fill" style="width: ${t.rate}%; background: var(--color-soc-gradient);"></div>
        </div>
      </div>
    `).join("");
  }
}

// Open CSR submission modal
let activeCsrIdForSubmit = "";
function openCSRSubmissionModal(csrId) {
  activeCsrIdForSubmit = csrId;
  const csr = state.csrActivities.find(c => c.id === csrId);
  if (!csr) return;
  
  document.getElementById("csr-modal-title").textContent = `Log CSR: ${csr.title}`;
  
  // Show / Hide evidence input notice depending on rule
  const evidenceInput = document.getElementById("csr-proof-file");
  const evidenceNotice = document.getElementById("csr-evidence-notice");
  if (csr.evidenceRequired) {
    evidenceNotice.style.display = "block";
    evidenceInput.required = true;
  } else {
    evidenceNotice.style.display = "none";
    evidenceInput.required = false;
  }
  
  document.getElementById("csr-modal-overlay").classList.add("active");
}

function closeCSRSubmissionModal() {
  document.getElementById("csr-modal-overlay").classList.remove("active");
}

// Submit CSR Participation Form
function submitCSRParticipation(event) {
  event.preventDefault();
  
  const csr = state.csrActivities.find(c => c.id === activeCsrIdForSubmit);
  if (!csr) return;
  
  const proofFileVal = document.getElementById("csr-proof-file").value;
  
  // BR-4: Evidence Requirement check
  if (state.esgConfiguration.toggles.evidenceRequired && csr.evidenceRequired && !proofFileVal) {
    showToast("Submission Rejected: Evidence file proof is required for this activity.", "error");
    return;
  }
  
  // Extract simple filename from file path
  const filename = proofFileVal ? proofFileVal.split("\\").pop() : "";
  
  const newPart = {
    id: `part-${Date.now()}`,
    employee: CURRENT_EMPLOYEE_NAME,
    activity: csr.id,
    proof: filename,
    approvalStatus: "Under Review",
    pointsEarned: csr.xp,
    completionDate: new Date().toISOString().split("T")[0]
  };
  
  state.employeeParticipations.unshift(newPart);
  addNotification(`New CSR submission by ${CURRENT_EMPLOYEE_NAME} for "${csr.title}" pending approval.`, "csr");
  
  saveState();
  closeCSRSubmissionModal();
  renderSocial();
}

// Approve / Reject CSR Participation Submissions
function approveCSRParticipation(participationId, isApproved) {
  const index = state.employeeParticipations.findIndex(p => p.id === participationId);
  if (index === -1) return;
  
  const part = state.employeeParticipations[index];
  const act = state.csrActivities.find(a => a.id === part.activity);
  
  if (isApproved) {
    part.approvalStatus = "Approved";
    // Award XP
    awardEmployeeXP(part.employee, part.pointsEarned);
    addNotification(`CSR submission approved for ${part.employee} (+${part.pointsEarned} XP).`, "csr");
    showToast(`CSR Approved: +${part.pointsEarned} XP awarded to ${part.employee}!`, "success");
  } else {
    part.approvalStatus = "Rejected";
    addNotification(`CSR submission rejected for ${part.employee} (Activity: ${act ? act.title : 'unknown'}).`, "csr");
    showToast(`CSR Participation rejected.`, "error");
  }
  
  saveState();
  renderSocial();
}

// Governance Tab Render
function renderGovernance() {
  // 1. Policies Catalog & acknowledgements progress
  const policyGrid = document.getElementById("policies-catalog-container");
  if (policyGrid) {
    policyGrid.innerHTML = state.esgPolicies.map(pol => {
      // Check current employee acknowledgment status
      const ack = state.policyAcknowledgements.find(a => a.employee === CURRENT_EMPLOYEE_NAME && a.policy === pol.id);
      const isAcked = ack && ack.status === "Acknowledged";
      
      const ackBtn = isAcked 
        ? `<span class="status-pill success">✓ Acknowledged</span>`
        : `<button class="btn btn-sm btn-gov" onclick="acknowledgePolicy('${pol.id}')">Acknowledge Policy</button>`;
        
      return `
        <div class="card" style="margin-bottom:16px;">
          <div class="flex-header" style="margin-bottom:12px;">
            <h3 style="font-size:1.05rem;">${pol.title}</h3>
            <div>
              <span class="status-pill info">${pol.version}</span>
              <span class="status-pill warning" style="margin-left:4px;">${pol.category}</span>
            </div>
          </div>
          <p class="reward-desc" style="margin-bottom:16px;">${pol.description}</p>
          <div class="flex-header" style="margin-bottom:0; border-top:1px solid var(--border-card); padding-top:12px;">
            <span style="font-size:0.75rem; color:var(--text-secondary);">Effective Date: ${pol.effectiveDate}</span>
            <div>${ackBtn}</div>
          </div>
        </div>
      `;
    }).join("");
  }
  
  // 2. Audit History log
  const auditTable = document.getElementById("audit-history-table");
  if (auditTable) {
    auditTable.innerHTML = state.audits.map(aud => {
      const dept = state.departments.find(d => d.id === aud.department);
      return `
        <tr>
          <td><strong>${aud.auditName}</strong></td>
          <td>${dept ? dept.name : "Unknown"}</td>
          <td>${aud.auditor}</td>
          <td><span style="font-size:0.8rem; color:var(--text-secondary); max-width: 300px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${aud.findings}">${aud.findings}</span></td>
          <td>${aud.date}</td>
          <td><span class="status-pill success">${aud.status}</span></td>
        </tr>
      `;
    }).join("");
  }
  
  // Update audits dropdown in compliance form
  const auditDropdown = document.getElementById("ci-audit");
  if (auditDropdown) {
    auditDropdown.innerHTML = `<option value="Independent">Independent (No Linked Audit)</option>` + 
      state.audits.map(aud => `<option value="${aud.id}">${aud.auditName}</option>`).join("");
  }
  
  // 3. Compliance Issues list
  const issuesTable = document.getElementById("compliance-issues-table");
  if (issuesTable) {
    const today = new Date().toISOString().split("T")[0];
    
    issuesTable.innerHTML = state.complianceIssues.map(issue => {
      const linkedAudit = state.audits.find(a => a.id === issue.audit);
      const isOverdue = issue.status === "Open" && issue.dueDate < today;
      const statusPill = isOverdue 
        ? `<span class="status-pill danger">⚠️ Overdue</span>`
        : `<span class="status-pill ${issue.status === 'Open' ? 'warning' : 'success'}">${issue.status}</span>`;
        
      const severityClass = issue.severity.toLowerCase(); // high, medium, low
      
      let actionBtn = "";
      if (issue.status === "Open") {
        actionBtn = `<button class="btn btn-sm" onclick="resolveComplianceIssue('${issue.id}')">Resolve</button>`;
      }
      
      return `
        <tr style="${isOverdue ? 'background-color: rgba(239, 44, 44, 0.02);' : ''}">
          <td><strong>${linkedAudit ? linkedAudit.auditName : "Independent"}</strong></td>
          <td><span class="status-pill difficulty-${severityClass}">${issue.severity}</span></td>
          <td>${issue.description}</td>
          <td><strong>${issue.owner}</strong></td>
          <td style="${isOverdue ? 'color: var(--color-danger); font-weight: 700;' : ''}">${issue.dueDate}</td>
          <td>${statusPill}</td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join("");
  }
}

// Acknowledge Governance Policy
function acknowledgePolicy(policyId) {
  const policy = state.esgPolicies.find(p => p.id === policyId);
  if (!policy) return;
  
  // Check if acknowledgement already exists
  const existingIndex = state.policyAcknowledgements.findIndex(a => a.employee === CURRENT_EMPLOYEE_NAME && a.policy === policyId);
  if (existingIndex !== -1) return;
  
  const newAck = {
    id: `ack-${Date.now()}`,
    employee: CURRENT_EMPLOYEE_NAME,
    policy: policyId,
    acknowledgedDate: new Date().toISOString().split("T")[0],
    status: "Acknowledged"
  };
  
  state.policyAcknowledgements.push(newAck);
  showToast(`Acknowledged policy: ${policy.title}`, "success");
  
  // Trigger auto badge check if enabled
  if (state.esgConfiguration.toggles.badgeAutoAward) {
    checkAndAwardBadges(CURRENT_EMPLOYEE_NAME);
  }
  
  saveState();
  renderAll();
}

// Resolve Open Compliance Issue
function resolveComplianceIssue(issueId) {
  const issue = state.complianceIssues.find(i => i.id === issueId);
  if (!issue) return;
  
  issue.status = "Resolved";
  addNotification(`Compliance Issue Resolved: "${issue.description}" has been completed.`, "compliance");
  showToast(`Compliance issue resolved!`, "success");
  
  saveState();
  renderAll();
}

// Gamification Tab Render
function renderGamification() {
  // 1. Employee Level Profile Dashboard
  const emp = state.employees.find(e => e.name === CURRENT_EMPLOYEE_NAME);
  if (!emp) return;
  
  const xpEl = document.getElementById("profile-xp");
  const pointsEl = document.getElementById("profile-points");
  const levelEl = document.getElementById("profile-level");
  const progressFill = document.getElementById("profile-level-progress-fill");
  
  if (xpEl) xpEl.textContent = emp.xp;
  if (pointsEl) pointsEl.textContent = emp.points;
  if (levelEl) levelEl.textContent = emp.level;
  
  if (progressFill) {
    // XP limits (1500 XP max level caps)
    let minXp = 0;
    let maxXp = 200;
    if (emp.level === 2) { minXp = 200; maxXp = 500; }
    else if (emp.level === 3) { minXp = 500; maxXp = 900; }
    else if (emp.level === 4) { minXp = 900; maxXp = 1500; }
    else if (emp.level === 5) { minXp = 1500; maxXp = 3000; } // virtual boundary
    
    const range = maxXp - minXp;
    const currentProgress = emp.xp - minXp;
    const pct = Math.max(0, Math.min(100, Math.round((currentProgress / range) * 100)));
    progressFill.style.width = `${pct}%`;
  }
  
  // 2. Render Challenges Grid (Active ones only)
  const chalGrid = document.getElementById("gam-challenges-grid");
  if (chalGrid) {
    chalGrid.innerHTML = state.challenges.map(chal => {
      const cat = state.categories.find(c => c.id === chal.category);
      
      // Check join status
      const joinRecord = state.challengeParticipations.find(cp => cp.employee === CURRENT_EMPLOYEE_NAME && cp.challenge === chal.id);
      
      let actionHtml = "";
      if (!joinRecord) {
        actionHtml = `<button class="btn btn-sm btn-primary" style="width:100%; margin-top:12px; justify-content:center;" onclick="joinChallenge('${chal.id}')">Join Challenge</button>`;
      } else if (joinRecord.approval === "Approved") {
        actionHtml = `<span class="status-pill success" style="display:block; text-align:center; width:100%; margin-top:12px;">✓ Completed</span>`;
      } else if (joinRecord.approval === "Under Review") {
        actionHtml = `<span class="status-pill warning" style="display:block; text-align:center; width:100%; margin-top:12px;">⏳ Pending Approval</span>`;
      } else {
        // Joined and active
        actionHtml = `
          <div style="margin-top:12px;">
            <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:8px;">Progress: <strong>${joinRecord.progress}</strong></div>
            <button class="btn btn-sm btn-env" style="width:100%; justify-content:center;" onclick="openChallengeSubmissionModal('${chal.id}')">Submit Completion</button>
          </div>
        `;
      }
      
      return `
        <div class="card challenge-card">
          <div>
            <div class="challenge-header">
              <span class="status-pill info">${cat ? cat.name : "Category"}</span>
              <span class="challenge-badge difficulty-${chal.difficulty.toLowerCase()}">${chal.difficulty}</span>
            </div>
            <h3 class="reward-title">${chal.title}</h3>
            <p class="reward-desc" style="margin-top:8px;">${chal.description}</p>
          </div>
          <div>
            <div class="challenge-meta-info">
              <span>Deadline: <strong>${chal.deadline}</strong></span>
              <span class="challenge-xp-badge">+${chal.xp} XP</span>
            </div>
            ${actionHtml}
          </div>
        </div>
      `;
    }).join("");
  }
  
  // 3. Render Badges bookcase
  const badgesBox = document.getElementById("gam-badges-shelf");
  if (badgesBox) {
    badgesBox.innerHTML = state.badges.map(badge => {
      const isUnlocked = emp.badges.includes(badge.id);
      return `
        <div class="badge-item ${isUnlocked ? '' : 'locked'}">
          <span class="badge-status-marker">${isUnlocked ? '🔓' : '🔒'}</span>
          <div class="badge-icon">${badge.icon}</div>
          <div class="badge-name">${badge.name}</div>
          <div class="badge-desc">${badge.description}</div>
        </div>
      `;
    }).join("");
  }
  
  // 4. Render Rewards Store catalog
  const rewardsCatalog = document.getElementById("gam-rewards-catalog");
  if (rewardsCatalog) {
    rewardsCatalog.innerHTML = state.rewards.map(reward => {
      const isDisabled = reward.stock <= 0 || emp.points < reward.pointsRequired;
      const btnStyle = isDisabled ? 'opacity: 0.5; cursor: not-allowed;' : '';
      
      return `
        <div class="card reward-item">
          <div>
            <h3 class="reward-title">${reward.name}</h3>
            <p class="reward-desc">${reward.description}</p>
          </div>
          <div>
            <div class="reward-footer">
              <span class="reward-cost">${reward.pointsRequired} Points</span>
              <span class="reward-stock">Stock: ${reward.stock}</span>
            </div>
            <button class="btn btn-sm btn-primary" style="width:100%; margin-top:12px; justify-content:center; ${btnStyle}" ${isDisabled ? 'disabled' : ''} onclick="redeemReward('${reward.id}')">Redeem Reward</button>
          </div>
        </div>
      `;
    }).join("");
  }
  
  // 5. Render Leaderboards table (All Employees)
  const fullLeaderboard = document.getElementById("gamification-leaderboard-body");
  if (fullLeaderboard) {
    const sortedEmp = [...state.employees].sort((a,b) => b.xp - a.xp);
    fullLeaderboard.innerHTML = sortedEmp.map((e, index) => {
      const dept = state.departments.find(d => d.id === e.department);
      const isCurrent = e.name === CURRENT_EMPLOYEE_NAME;
      
      return `
        <tr style="${isCurrent ? 'background-color: rgba(59, 130, 246, 0.05); font-weight: 600;' : ''}">
          <td><strong>#${index+1}</strong></td>
          <td>${e.name} ${isCurrent ? '<span class="status-pill info btn-sm" style="padding:1px 6px; font-size:0.6rem;">You</span>' : ''}</td>
          <td>${e.role}</td>
          <td>${dept ? dept.name : "General"}</td>
          <td><span class="level-badge">Lvl ${e.level}</span></td>
          <td><strong>${e.xp}</strong></td>
          <td>${e.badges.length} unlocked</td>
        </tr>
      `;
    }).join("");
  }
}

// Join Challenge
function joinChallenge(challengeId) {
  const challenge = state.challenges.find(c => c.id === challengeId);
  if (!challenge) return;
  
  const newCP = {
    id: `cp-${Date.now()}`,
    challenge: challengeId,
    employee: CURRENT_EMPLOYEE_NAME,
    progress: "Started",
    proof: "",
    approval: "Pending",
    xpAwarded: 0
  };
  
  state.challengeParticipations.push(newCP);
  showToast(`Joined challenge: ${challenge.title}`, "success");
  
  saveState();
  renderGamification();
}

// Open Challenge completion submission modal
let activeChalIdForSubmit = "";
function openChallengeSubmissionModal(challengeId) {
  activeChalIdForSubmit = challengeId;
  const chal = state.challenges.find(c => c.id === challengeId);
  if (!chal) return;
  
  document.getElementById("chal-modal-title").textContent = `Complete Challenge: ${chal.title}`;
  document.getElementById("chal-modal-overlay").classList.add("active");
}

function closeChallengeSubmissionModal() {
  document.getElementById("chal-modal-overlay").classList.remove("active");
}

// Submit Challenge Proof
function submitChallengeCompletion(event) {
  event.preventDefault();
  
  const chal = state.challenges.find(c => c.id === activeChalIdForSubmit);
  if (!chal) return;
  
  const proofFileVal = document.getElementById("chal-proof-file").value;
  const progressText = document.getElementById("chal-progress").value || "Completed";
  
  const filename = proofFileVal ? proofFileVal.split("\\").pop() : "";
  
  // Find joined record and update it
  const cpRecord = state.challengeParticipations.find(cp => cp.employee === CURRENT_EMPLOYEE_NAME && cp.challenge === chal.id);
  if (cpRecord) {
    cpRecord.progress = progressText;
    cpRecord.proof = filename;
    cpRecord.approval = "Under Review";
  }
  
  addNotification(`Challenge Submission: ${CURRENT_EMPLOYEE_NAME} logged completion for "${chal.title}".`, "gamification");
  showToast(`Challenge submission sent for review.`, "success");
  
  // For validation ease, simulate instant automatic HR approval after 5 seconds or allow Admin to instantly click approve.
  // Actually, we'll build an admin panel widget in Governance or Settings, or we can just instantly auto-approve it after 1 second for seamless testing of gamification!
  // Let's instantly auto-approve challenge completions after 1 second so the user can easily witness points, badges, notifications, and scores. This is very friendly.
  setTimeout(() => {
    const cp = state.challengeParticipations.find(c => c.employee === CURRENT_EMPLOYEE_NAME && c.challenge === chal.id && c.approval === "Under Review");
    if (cp) {
      cp.approval = "Approved";
      cp.xpAwarded = chal.xp;
      awardEmployeeXP(CURRENT_EMPLOYEE_NAME, chal.xp);
      addNotification(`Challenge Approved: ${CURRENT_EMPLOYEE_NAME} successfully completed "${chal.title}" (+${chal.xp} XP).`, "gamification");
      renderAll();
    }
  }, 1000);
  
  saveState();
  closeChallengeSubmissionModal();
  renderGamification();
}

// Settings & Admin Tab Render
function renderSettings() {
  const w = state.esgConfiguration.weights;
  
  // Load Sliders values
  document.getElementById("weight-env").value = w.environmental;
  document.getElementById("weight-env-val").textContent = `${w.environmental}%`;
  
  document.getElementById("weight-soc").value = w.social;
  document.getElementById("weight-soc-val").textContent = `${w.social}%`;
  
  document.getElementById("weight-gov").value = w.governance;
  document.getElementById("weight-gov-val").textContent = `${w.governance}%`;
  
  updateWeightsSum();

  // Load Rule Toggles
  document.getElementById("toggle-auto-calc").checked = state.esgConfiguration.toggles.autoCalc;
  document.getElementById("toggle-evidence").checked = state.esgConfiguration.toggles.evidenceRequired;
  document.getElementById("toggle-badge-award").checked = state.esgConfiguration.toggles.badgeAutoAward;
  
  // Render departments management CRUD list
  const deptList = document.getElementById("admin-departments-list");
  if (deptList) {
    deptList.innerHTML = state.departments.map(d => `
      <div class="leaderboard-item" style="margin-bottom:8px;">
        <div>
          <strong>${d.name} (${d.code})</strong>
          <div style="font-size:0.75rem; color:var(--text-secondary);">Head: ${d.head} | Employees: ${d.employeeCount}</div>
        </div>
        <button class="btn btn-sm" style="border-color:var(--color-danger); color:var(--color-danger);" onclick="deleteDepartment('${d.id}')">Delete</button>
      </div>
    `).join("");
  }
}

// Weights auto balance logic
function updateWeightsSum() {
  const env = parseInt(document.getElementById("weight-env").value);
  const soc = parseInt(document.getElementById("weight-soc").value);
  const gov = parseInt(document.getElementById("weight-gov").value);
  
  const sum = env + soc + gov;
  const sumEl = document.getElementById("weights-sum-display");
  const saveBtn = document.getElementById("save-weights-btn");
  
  if (sumEl) sumEl.textContent = `Total Sum: ${sum}%`;
  
  if (sum === 100) {
    if (sumEl) sumEl.style.color = "var(--color-success)";
    if (saveBtn) saveBtn.disabled = false;
  } else {
    if (sumEl) sumEl.style.color = "var(--color-danger)";
    if (saveBtn) saveBtn.disabled = true;
  }
}

function saveWeights() {
  const env = parseInt(document.getElementById("weight-env").value);
  const soc = parseInt(document.getElementById("weight-soc").value);
  const gov = parseInt(document.getElementById("weight-gov").value);
  
  if (env + soc + gov !== 100) {
    showToast("Weights must sum exactly to 100%!", "error");
    return;
  }
  
  state.esgConfiguration.weights = {
    environmental: env,
    social: soc,
    governance: gov
  };
  
  showToast("Scoring weights saved successfully!", "success");
  addNotification(`Scoring weights adjusted: Environmental ${env}%, Social ${soc}%, Governance ${gov}%.`, "system");
  saveState();
  renderAll();
}

function saveToggles() {
  state.esgConfiguration.toggles.autoCalc = document.getElementById("toggle-auto-calc").checked;
  state.esgConfiguration.toggles.evidenceRequired = document.getElementById("toggle-evidence").checked;
  state.esgConfiguration.toggles.badgeAutoAward = document.getElementById("toggle-badge-award").checked;
  
  showToast("Business Rules configurations saved!", "success");
  saveState();
  renderAll();
}

// CRUD - Department Management
function addDepartment(event) {
  event.preventDefault();
  
  const name = document.getElementById("dept-name").value;
  const code = document.getElementById("dept-code").value;
  const head = document.getElementById("dept-head").value;
  const count = parseInt(document.getElementById("dept-count").value) || 0;
  
  const newDept = {
    id: `dept-${Date.now()}`,
    name: name,
    code: code.toUpperCase(),
    head: head,
    parentDepartment: null,
    employeeCount: count,
    status: "Active"
  };
  
  state.departments.push(newDept);
  showToast(`Added Department: ${name}`, "success");
  
  document.getElementById("add-dept-form").reset();
  saveState();
  renderSettings();
  renderOverview();
}

function deleteDepartment(deptId) {
  // Prevent deleting if referenced
  const isReferenced = state.carbonTransactions.some(t => t.department === deptId) || 
                       state.environmentalGoals.some(g => g.department === deptId);
                       
  if (isReferenced) {
    showToast("Cannot delete department: Linked to carbon transactions or environmental targets.", "error");
    return;
  }
  
  state.departments = state.departments.filter(d => d.id !== deptId);
  showToast("Department deleted", "success");
  saveState();
  renderSettings();
  renderOverview();
}

// -------------------------------------------------------------
// Reporting Module (Filters & Exports)
// -------------------------------------------------------------

function runReportFilter() {
  const deptFilter = document.getElementById("report-dept-filter").value;
  const moduleFilter = document.getElementById("report-module-filter").value;
  const searchFilter = document.getElementById("report-search-query").value.toLowerCase();
  
  const reportResults = document.getElementById("reports-results-body");
  if (!reportResults) return;
  
  let records = [];
  
  // Collect matching transaction logs
  if (moduleFilter === "all" || moduleFilter === "environmental") {
    state.carbonTransactions.forEach(tx => {
      const dept = state.departments.find(d => d.id === tx.department);
      const ef = state.emissionFactors.find(e => e.id === tx.emissionFactor);
      
      // Apply department filter
      if (deptFilter !== "all" && tx.department !== deptFilter) return;
      
      // Apply search query
      const recordText = `${tx.sourceRecord} ${dept ? dept.name : ''} ${ef ? ef.category : ''}`.toLowerCase();
      if (searchFilter && !recordText.includes(searchFilter)) return;
      
      records.push({
        module: "Environmental",
        details: `Carbon record: ${tx.sourceRecord} (${ef ? ef.category : 'Unknown'})`,
        department: dept ? dept.name : "Unknown",
        metric: `${tx.quantity.toLocaleString()} units`,
        impact: `${tx.calculatedCo2e.toFixed(2)} tCO2e`,
        date: tx.date
      });
    });
  }
  
  if (moduleFilter === "all" || moduleFilter === "social") {
    state.employeeParticipations.forEach(p => {
      const act = state.csrActivities.find(a => a.id === p.activity);
      const emp = state.employees.find(e => e.name === p.employee);
      
      if (deptFilter !== "all" && emp && emp.department !== deptFilter) return;
      
      const recordText = `${p.employee} ${act ? act.title : ''}`.toLowerCase();
      if (searchFilter && !recordText.includes(searchFilter)) return;
      
      records.push({
        module: "Social",
        details: `CSR activity participation: "${act ? act.title : 'CSR'}" by ${p.employee}`,
        department: emp ? (state.departments.find(d => d.id === emp.department)?.name || "General") : "General",
        metric: p.approvalStatus,
        impact: `+${p.pointsEarned} XP`,
        date: p.completionDate
      });
    });
  }
  
  if (moduleFilter === "all" || moduleFilter === "governance") {
    state.complianceIssues.forEach(issue => {
      const audit = state.audits.find(a => a.id === issue.audit);
      const emp = state.employees.find(e => e.name === issue.owner);
      
      if (deptFilter !== "all" && emp && emp.department !== deptFilter) return;
      
      const recordText = `${issue.description} ${issue.owner}`.toLowerCase();
      if (searchFilter && !recordText.includes(searchFilter)) return;
      
      records.push({
        module: "Governance",
        details: `Compliance Issue: "${issue.description}"`,
        department: emp ? (state.departments.find(d => d.id === emp.department)?.name || "General") : "General",
        metric: `Severity: ${issue.severity}`,
        impact: issue.status,
        date: issue.dueDate
      });
    });
  }
  
  // Populate UI table
  if (records.length === 0) {
    reportResults.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color:var(--text-secondary);">No records found matching filters.</td></tr>';
    return;
  }
  
  // Sort records by date descending
  records.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  reportResults.innerHTML = records.map(r => `
    <tr>
      <td><span class="status-pill ${r.module === 'Environmental' ? 'success' : (r.module === 'Social' ? 'info' : 'warning')}">${r.module}</span></td>
      <td><strong>${r.details}</strong></td>
      <td>${r.department}</td>
      <td>${r.metric}</td>
      <td><strong>${r.impact}</strong></td>
      <td>${r.date}</td>
    </tr>
  `).join("");
}

// Export custom report as CSV
function exportReportCSV() {
  const deptFilter = document.getElementById("report-dept-filter").value;
  const moduleFilter = document.getElementById("report-module-filter").value;
  
  let records = [];
  
  // Collect matching records similar to runReportFilter()
  if (moduleFilter === "all" || moduleFilter === "environmental") {
    state.carbonTransactions.forEach(tx => {
      if (deptFilter !== "all" && tx.department !== deptFilter) return;
      const dept = state.departments.find(d => d.id === tx.department);
      const ef = state.emissionFactors.find(e => e.id === tx.emissionFactor);
      records.push(["Environmental", `Carbon transaction ${tx.sourceRecord} (${ef ? ef.category : 'Unknown'})`, dept ? dept.name : "Unknown", `${tx.quantity} units`, `${tx.calculatedCo2e} tCO2e`, tx.date]);
    });
  }
  
  if (moduleFilter === "all" || moduleFilter === "social") {
    state.employeeParticipations.forEach(p => {
      const emp = state.employees.find(e => e.name === p.employee);
      if (deptFilter !== "all" && emp && emp.department !== deptFilter) return;
      const act = state.csrActivities.find(a => a.id === p.activity);
      records.push(["Social", `CSR Participation: ${act ? act.title : 'Unknown'} by ${p.employee}`, emp ? (state.departments.find(d => d.id === emp.department)?.name || "General") : "General", p.approvalStatus, `+${p.pointsEarned} XP`, p.completionDate]);
    });
  }
  
  if (moduleFilter === "all" || moduleFilter === "governance") {
    state.complianceIssues.forEach(issue => {
      const emp = state.employees.find(e => e.name === issue.owner);
      if (deptFilter !== "all" && emp && emp.department !== deptFilter) return;
      const linkedAudit = state.audits.find(a => a.id === issue.audit);
      records.push(["Governance", `Compliance Issue: ${issue.description}`, emp ? (state.departments.find(d => d.id === emp.department)?.name || "General") : "General", `Severity: ${issue.severity}`, issue.status, issue.dueDate]);
    });
  }
  
  // Build CSV content
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Module,Details,Department,Metric,Impact/Status,Date\n";
  
  records.forEach(row => {
    const escapedRow = row.map(val => `"${val.replace(/"/g, '""')}"`);
    csvContent += escapedRow.join(",") + "\n";
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `ecosphere_esg_report_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("CSV report exported successfully!", "success");
}

function printReport() {
  window.print();
}

// -------------------------------------------------------------
// Transaction Submit Actions
// -------------------------------------------------------------

// Add Carbon Transaction
function addCarbonTransaction(event) {
  event.preventDefault();
  
  const recordName = document.getElementById("tx-source-record").value;
  const deptId = document.getElementById("tx-department").value;
  const efId = document.getElementById("tx-ef-factor").value;
  const quantity = parseFloat(document.getElementById("tx-quantity").value);
  const manualCo2e = parseFloat(document.getElementById("tx-co2e-manual").value) || 0;
  
  const ef = state.emissionFactors.find(e => e.id === efId);
  if (!ef) return;
  
  let finalCo2e = 0;
  let method = "Manual";
  
  // BR-3: Auto Emission Calculation check
  if (state.esgConfiguration.toggles.autoCalc) {
    finalCo2e = quantity * ef.co2eFactor;
    method = "Auto";
  } else {
    finalCo2e = manualCo2e;
    method = "Manual";
  }
  
  const newTx = {
    id: `tx-${Date.now()}`,
    sourceRecord: recordName,
    department: deptId,
    emissionFactor: efId,
    quantity: quantity,
    calculatedCo2e: finalCo2e,
    date: new Date().toISOString().split("T")[0],
    calculationMethod: method
  };
  
  state.carbonTransactions.unshift(newTx);
  showToast(`Carbon Transaction Logged: ${finalCo2e.toFixed(3)} tCO2e`, "success");
  
  // Adjust goal currentValue automatically if the transaction matches a goal department and category
  const dept = state.departments.find(d => d.id === deptId);
  if (dept) {
    const goal = state.environmentalGoals.find(g => g.department === deptId && g.metric.toLowerCase().includes(ef.category.toLowerCase().split(" ")[0]));
    if (goal) {
      goal.currentValue += quantity;
      if (goal.currentValue > goal.targetValue) {
        addNotification(`Goal Limit Exceeded: ${dept.name} exceeded target limit on "${goal.metric}".`, "environmental");
      }
    }
  }
  
  document.getElementById("add-tx-form").reset();
  saveState();
  renderEnvironmental();
  renderOverview();
}

// Add Compliance Issue
function addComplianceIssue(event) {
  event.preventDefault();
  
  const auditId = document.getElementById("ci-audit").value;
  const severity = document.getElementById("ci-severity").value;
  const description = document.getElementById("ci-description").value;
  const owner = document.getElementById("ci-owner").value;
  const dueDate = document.getElementById("ci-due-date").value;
  
  // BR-6 Check: every issue must have Owner and Due Date (enforced by required inputs in HTML, but validated here)
  if (!owner || !dueDate) {
    showToast("Error: Owner and Due Date are mandatory fields.", "error");
    return;
  }
  
  const newIssue = {
    id: `ci-${Date.now()}`,
    audit: auditId,
    severity: severity,
    description: description,
    owner: owner,
    dueDate: dueDate,
    status: "Open"
  };
  
  state.complianceIssues.unshift(newIssue);
  
  // Check if immediately overdue
  const today = new Date().toISOString().split("T")[0];
  if (dueDate < today) {
    addNotification(`Compliance issue raised (OVERDUE): "${description}" assigned to ${owner}.`, "compliance");
  } else {
    addNotification(`Compliance issue raised: "${description}" assigned to ${owner}.`, "compliance");
  }
  
  document.getElementById("add-ci-form").reset();
  saveState();
  renderGovernance();
  renderOverview();
}

// -------------------------------------------------------------
// Setup Page Event Listeners
// -------------------------------------------------------------
function setupEventListeners() {
  // Theme Toggle click
  const themeToggle = document.querySelector(".theme-toggle-btn");
  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
  
  // Bell Notifications click
  const bell = document.querySelector(".notif-bell");
  if (bell) bell.addEventListener("click", toggleNotifications);
  
  // Form submits
  const txForm = document.getElementById("add-tx-form");
  if (txForm) txForm.addEventListener("submit", addCarbonTransaction);
  
  const csrForm = document.getElementById("add-csr-participation-form");
  if (csrForm) csrForm.addEventListener("submit", submitCSRParticipation);
  
  const chalForm = document.getElementById("add-chal-completion-form");
  if (chalForm) chalForm.addEventListener("submit", submitChallengeCompletion);
  
  const ciForm = document.getElementById("add-ci-form");
  if (ciForm) ciForm.addEventListener("submit", addComplianceIssue);
  
  const deptForm = document.getElementById("add-dept-form");
  if (deptForm) deptForm.addEventListener("submit", addDepartment);
  
  // Weight Sliders change listeners
  const wEnv = document.getElementById("weight-env");
  const wSoc = document.getElementById("weight-soc");
  const wGov = document.getElementById("weight-gov");
  
  if (wEnv) {
    wEnv.addEventListener("input", (e) => {
      document.getElementById("weight-env-val").textContent = `${e.target.value}%`;
      updateWeightsSum();
    });
  }
  if (wSoc) {
    wSoc.addEventListener("input", (e) => {
      document.getElementById("weight-soc-val").textContent = `${e.target.value}%`;
      updateWeightsSum();
    });
  }
  if (wGov) {
    wGov.addEventListener("input", (e) => {
      document.getElementById("weight-gov-val").textContent = `${e.target.value}%`;
      updateWeightsSum();
    });
  }
}
