// In-memory storage (this will now be initially populated from localStorage)
class BudgetTracker {
  static supportsLocalStorage() {
    try {
      const testKey = "__localStorageTest__";
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
  constructor() {
    this.transactions = []; // Initialize transactions as a class property

    // Initialize and validate DOM elements
    this.form = document.getElementById("transactionForm");
    this.transactionsList = document.getElementById("transactionsList");
    this.totalIncomeEl = document.getElementById("totalIncome");
    this.totalExpensesEl = document.getElementById("totalExpenses");
    this.currentBalanceEl = document.getElementById("currentBalance");
    this.balanceCardEl = document.getElementById("balanceCard");
    this.categoryGrid = document.getElementById("categoryGrid");

    // Debug logging
    console.log("DOM Elements found:", {
      form: !!this.form,
      transactionsList: !!this.transactionsList,
      totalIncome: !!this.totalIncomeEl,
      totalExpenses: !!this.totalExpensesEl,
      currentBalance: !!this.currentBalanceEl,
    });

    this.localStorageAvailable = BudgetTracker.supportsLocalStorage();
    console.log("localStorage available:", this.localStorageAvailable);

    // New properties for budget goals and insights
    this.budgetGoals = {
      income: 5000,
      savings: 20,
      categories: {
        rent_mortgage: 1500,
        food: 500,
        transport: 300,
        entertainment: 200,
        utilities: 200,
        shopping: 300,
        health: 200,
        other: 200,
      },
    };

    this.charts = {
      monthly: null,
      category: null,
    };

    this.init();
  }

  init() {
    // Check if we're on the correct page - look for budget tracker specific elements
    if (
      !document.getElementById("transactionForm") ||
      !document.getElementById("totalIncome")
    ) {
      console.log(
        "Budget Tracker: Not on the correct page, skipping initialization"
      );
      return;
    }

    this.loadTransactions();
    this.loadBudgetGoals();
    this.renderTransactions();
    this.updateSummary();
    this.initializeCharts();
    this.updateInsights();
    this.setupBudgetGoalsForm();
    this.bindEvents();
    this.bindCategorySelection();
    this.animateCategoryIcons();
  }

  animateCategoryIcons() {
    const categoryItems = document.querySelectorAll(".category-item");
    if (categoryItems.length > 0) {
      categoryItems.forEach((item, index) => {
        setTimeout(() => {
          item.classList.add("show");
        }, index * 80);
      });
    }
  }

  bindCategorySelection() {
    const categoryItems = document.querySelectorAll(".category-item");
    const categoryInput = document.getElementById("category");
    const categoryDisplayInput = document.getElementById("categoryDisplay");
    const descriptionTextarea = document.getElementById("description");

    if (
      categoryItems.length > 0 &&
      categoryInput &&
      categoryDisplayInput &&
      descriptionTextarea
    ) {
      categoryItems.forEach((item) => {
        item.addEventListener("click", () => {
          categoryItems.forEach((i) => i.classList.remove("selected"));
          item.classList.add("selected");

          categoryInput.value = item.dataset.value;
          categoryDisplayInput.value = `${item.dataset.icon} ${item.dataset.label}`;

          if (descriptionTextarea.value.trim() === "") {
            descriptionTextarea.value = item.dataset.label;
          }
        });
      });
    }
  }

  bindEvents() {
    const incomeBtn = document.querySelector(".btn-income");
    const expenseBtn = document.querySelector(".btn-expense");

    if (incomeBtn) {
      incomeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.addTransaction("income");
      });
    }

    if (expenseBtn) {
      expenseBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.addTransaction("expense");
      });
    }

    if (this.form) {
      this.form.addEventListener("submit", (e) => {
        e.preventDefault();
      });
    }
  }

  addTransaction(type) {
    const amountInput = document.getElementById("amount");
    const categoryInput = document.getElementById("category");
    const descriptionInput = document.getElementById("description");
    const dateInput = document.getElementById("transactionDate");

    if (!amountInput || !categoryInput || !descriptionInput || !dateInput) {
      console.error("Required form elements not found");
      return;
    }

    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const description = descriptionInput.value;
    const transactionDate = dateInput.value;

    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!category) {
      alert("Please select a category");
      return;
    }

    if (!description.trim()) {
      alert("Please enter a description");
      return;
    }

    if (!transactionDate) {
      alert("Please select a date for the transaction.");
      return;
    }

    const transaction = {
      id: Date.now(),
      type,
      amount,
      category,
      categoryDisplay: category,
      description: description.trim(),
      date: transactionDate,
    };

    this.transactions.unshift(transaction);

    this.saveTransactions();
    this.renderTransactions();
    this.updateSummary();

    this.form.reset();
    document
      .querySelectorAll(".category-item")
      .forEach((item) => item.classList.remove("selected"));
    categoryInput.value = "";
    dateInput.value = "";

    this.showSuccessMessage(type, amount);

    // Check if the transaction might exceed budget
    if (type === "expense") {
      const monthlyExpenses = this.getCurrentMonthCategoryExpenses();
      const budget = this.budgetGoals.categories[category];
      if (monthlyExpenses[category] > budget * 0.8) {
        this.showWarningMessage(
          `Warning: You've used ${Math.round(
            (monthlyExpenses[category] / budget) * 100
          )}% of your ${this.formatCategoryName(category)} budget.`
        );
      }
    }
  }

  showSuccessMessage(type, amount) {
    const message =
      type === "income"
        ? `Income of $${amount.toFixed(2)} added successfully!`
        : `Expense of $${amount.toFixed(2)} added successfully!`;

    const successDiv = document.createElement("div");
    successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            font-weight: 600;
            animation: fadeOut 5s forwards;
        `;
    successDiv.textContent = `✅ ${message}`;

    document.body.appendChild(successDiv);

    setTimeout(() => {
      successDiv.remove();
    }, 5000);
  }

  showWarningMessage(message) {
    const warningDiv = document.createElement("div");
    warningDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f59e0b;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            font-weight: 600;
            animation: fadeOut 5s forwards;
        `;
    warningDiv.textContent = `⚠️ ${message}`;

    document.body.appendChild(warningDiv);

    setTimeout(() => {
      warningDiv.remove();
    }, 5000);
  }

  deleteTransaction(id) {
    if (confirm("Are you sure you want to delete this transaction?")) {
      this.transactions = this.transactions.filter((t) => t.id !== id);
      this.saveTransactions();
      this.renderTransactions();
      this.updateSummary();
    }
  }

  loadTransactions() {
    if (this.localStorageAvailable) {
      const storedTransactions = localStorage.getItem("transactions");
      if (storedTransactions) {
        this.transactions = JSON.parse(storedTransactions);
        console.log(
          "Transactions loaded from localStorage:",
          this.transactions.length
        );
      }
    } else {
      console.warn(
        "localStorage is not available. Data will not be persisted."
      );
    }
  }

  saveTransactions() {
    if (this.localStorageAvailable) {
      localStorage.setItem("transactions", JSON.stringify(this.transactions));
      console.log("Transactions saved to localStorage.");
    }
  }

  loadBudgetGoals() {
    if (this.localStorageAvailable) {
      const storedGoals = localStorage.getItem("budgetGoals");
      if (storedGoals) {
        this.budgetGoals = JSON.parse(storedGoals);
      }
    }
  }

  saveBudgetGoals() {
    if (this.localStorageAvailable) {
      localStorage.setItem("budgetGoals", JSON.stringify(this.budgetGoals));
    }
  }

  updateInsights() {
    // Check if insight elements exist
    const trendsContent = document.querySelector(".trends-content");
    const recommendationsContent = document.querySelector(
      ".recommendations-content"
    );
    const savingsContent = document.querySelector(".savings-content");

    if (!trendsContent || !recommendationsContent || !savingsContent) {
      console.warn("Insight elements not found. Skipping insights update.");
      return;
    }

    this.updateSpendingTrends();
    this.updateRecommendations();
    this.updateSavingsInsights();
    this.updateProgressBars();
  }

  updateProgressBars() {
    const incomeProgress = document.getElementById("incomeProgress");
    const expenseProgress = document.getElementById("expenseProgress");
    const savingsRate = document.getElementById("savingsRate");

    if (!incomeProgress || !expenseProgress || !savingsRate) {
      console.warn(
        "Progress bar elements not found. Skipping progress update."
      );
      return;
    }

    const income = this.transactions
      .filter((t) => t.type === "income" && this.isCurrentMonth(t.date))
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = this.transactions
      .filter((t) => t.type === "expense" && this.isCurrentMonth(t.date))
      .reduce((sum, t) => sum + t.amount, 0);

    // Update progress bars
    incomeProgress.style.width = `${Math.min(
      100,
      (income / this.budgetGoals.income) * 100
    )}%`;
    expenseProgress.style.width = `${Math.min(
      100,
      (expenses / this.getMonthlyExpenseBudget()) * 100
    )}%`;

    // Update savings rate
    const currentSavingsRate =
      income > 0 ? ((income - expenses) / income) * 100 : 0;
    savingsRate.textContent = `Savings Rate: ${currentSavingsRate.toFixed(1)}%`;
    savingsRate.style.color =
      currentSavingsRate >= this.budgetGoals.savings ? "#10b981" : "#ef4444";
  }

  updateSpendingTrends() {
    const trendsContent = document.querySelector(".trends-content");
    if (!trendsContent) return;

    const currentMonthExpenses = this.getCurrentMonthCategoryExpenses();
    const lastMonthExpenses = this.getLastMonthCategoryExpenses();

    const trends = Object.keys(this.budgetGoals.categories)
      .map((category) => {
        const current = currentMonthExpenses[category] || 0;
        const last = lastMonthExpenses[category] || 0;
        const change = last === 0 ? 100 : ((current - last) / last) * 100;

        return {
          category,
          change,
          current,
        };
      })
      .filter((trend) => trend.current > 0)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    trendsContent.innerHTML =
      trends
        .map(
          (trend) => `
                <div class="trend-item">
                    <div class="trend-label">
                        <span>${this.formatCategoryName(trend.category)}</span>
                        <span class="trend-arrow ${
                          trend.change > 0 ? "trend-up" : "trend-down"
                        }">
                            ${trend.change > 0 ? "↑" : "↓"}
                        </span>
                    </div>
                    <div>${Math.abs(trend.change).toFixed(1)}%</div>
                </div>
            `
        )
        .join("") || "<p>No spending trends available yet.</p>";
  }

  updateRecommendations() {
    const recommendationsContent = document.querySelector(
      ".recommendations-content"
    );
    if (!recommendationsContent) return;

    const currentExpenses = this.getCurrentMonthCategoryExpenses();
    const recommendations = [];

    // Check each category against its budget
    Object.entries(this.budgetGoals.categories).forEach(
      ([category, budget]) => {
        const spent = currentExpenses[category] || 0;
        const remainingDays = this.getRemainingDaysInMonth();
        const projectedSpend =
          (spent / this.getDayOfMonth()) * this.getDaysInMonth();

        if (projectedSpend > budget) {
          const overspendAmount = projectedSpend - budget;
          const dailyAdjustment = overspendAmount / remainingDays;
          recommendations.push({
            category,
            message: `Reduce ${this.formatCategoryName(
              category
            )} spending by $${dailyAdjustment.toFixed(
              2
            )} per day to meet budget.`,
            severity: "high",
          });
        }
      }
    );

    // Add general recommendations
    const totalExpenses = Object.values(currentExpenses).reduce(
      (a, b) => a + b,
      0
    );
    const totalBudget = Object.values(this.budgetGoals.categories).reduce(
      (a, b) => a + b,
      0
    );

    if (totalExpenses > totalBudget * 0.8) {
      recommendations.push({
        message:
          "You're approaching your total monthly budget. Consider reducing non-essential expenses.",
        severity: "medium",
      });
    }

    // Sort by severity
    recommendations.sort((a, b) =>
      b.severity === "high" ? 1 : a.severity === "high" ? -1 : 0
    );

    recommendationsContent.innerHTML =
      recommendations.length > 0
        ? recommendations
            .map(
              (rec) => `
                    <div class="recommendation-item">
                        <p>${rec.message}</p>
                    </div>
                `
            )
            .join("")
        : "<p>You're on track with your budgets! 🎉</p>";
  }

  updateSavingsInsights() {
    const savingsContent = document.querySelector(".savings-content");
    if (!savingsContent) return;

    const currentExpenses = this.getCurrentMonthCategoryExpenses();
    const opportunities = [];

    // Calculate potential savings
    Object.entries(currentExpenses).forEach(([category, amount]) => {
      const budget = this.budgetGoals.categories[category];
      if (amount < budget) {
        const savings = budget - amount;
        if (savings >= 50) {
          // Only show significant savings
          opportunities.push({
            category,
            amount: savings,
          });
        }
      }
    });

    // Calculate and suggest emergency fund
    const monthlyIncome = this.transactions
      .filter((t) => t.type === "income" && this.isCurrentMonth(t.date))
      .reduce((sum, t) => sum + t.amount, 0);

    if (monthlyIncome > 0) {
      const recommendedEmergencyFund = monthlyIncome * 3;
      opportunities.push({
        category: "emergency_fund",
        message: `Aim to save $${recommendedEmergencyFund.toFixed(
          2
        )} (3 months of income) for emergencies.`,
      });
    }

    savingsContent.innerHTML =
      opportunities.length > 0
        ? opportunities
            .map((opp) =>
              opp.amount
                ? `<div class="savings-opportunity">
                        <span>${this.formatCategoryName(opp.category)}</span>
                        <span class="savings-amount">$${opp.amount.toFixed(
                          2
                        )}</span>
                       </div>`
                : `<div class="savings-opportunity">${opp.message}</div>`
            )
            .join("")
        : "<p>Keep looking for ways to optimize your spending!</p>";
  }

  setupBudgetGoalsForm() {
    const form = document.getElementById("budgetGoalsForm");
    const categoryBudgets = document.getElementById("categoryBudgets");
    const incomeGoal = document.getElementById("incomeGoal");
    const savingsGoal = document.getElementById("savingsGoal");

    if (!form || !categoryBudgets || !incomeGoal || !savingsGoal) {
      console.warn(
        "Budget goals form elements not found. Skipping form setup."
      );
      return;
    }

    // Set initial values
    incomeGoal.value = this.budgetGoals.income;
    savingsGoal.value = this.budgetGoals.savings;

    // Create category budget inputs
    categoryBudgets.innerHTML = Object.entries(this.budgetGoals.categories)
      .map(
        ([category, amount]) => `
                <div class="category-budget-item">
                    <label for="budget_${category}">${this.formatCategoryName(
          category
        )}</label>
                    <input type="number" id="budget_${category}" 
                           value="${amount}" min="0" step="10"
                           class="category-budget-input">
                </div>
            `
      )
      .join("");

    // Handle form submission
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.budgetGoals.income = parseFloat(incomeGoal.value);
      this.budgetGoals.savings = parseFloat(savingsGoal.value);

      // Update category budgets
      Object.keys(this.budgetGoals.categories).forEach((category) => {
        const budgetInput = document.getElementById(`budget_${category}`);
        if (budgetInput) {
          this.budgetGoals.categories[category] = parseFloat(budgetInput.value);
        }
      });

      this.saveBudgetGoals();
      this.updateSummary();
      this.updateInsights();
      this.showSuccessMessage("success", "Budget goals updated!");
    });
  }

  formatCategoryName(category) {
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("/");
  }

  initializeCharts() {
    // Check if chart elements exist before initializing
    const monthlyCanvas = document.getElementById("monthlyChart");
    const categoryCanvas = document.getElementById("categoryChart");

    if (!monthlyCanvas || !categoryCanvas) {
      console.warn(
        "Chart canvas elements not found. Charts will not be initialized."
      );
      return;
    }

    try {
      // Monthly Overview Chart
      const monthlyCtx = monthlyCanvas.getContext("2d");
      this.charts.monthly = new Chart(monthlyCtx, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Income",
              borderColor: "#10b981",
              data: [],
            },
            {
              label: "Expenses",
              borderColor: "#ef4444",
              data: [],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });

      // Category Breakdown Chart
      const categoryCtx = categoryCanvas.getContext("2d");
      this.charts.category = new Chart(categoryCtx, {
        type: "doughnut",
        data: {
          labels: [],
          datasets: [
            {
              data: [],
              backgroundColor: [
                "#3b82f6",
                "#ef4444",
                "#10b981",
                "#f59e0b",
                "#6366f1",
                "#ec4899",
                "#8b5cf6",
                "#14b8a6",
              ],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
            },
          },
        },
      });
    } catch (error) {
      console.error("Error initializing charts:", error);
    }
  }

  updateCharts() {
    // Check if charts are initialized
    if (!this.charts.monthly || !this.charts.category) {
      console.warn("Charts not initialized. Skipping chart update.");
      return;
    }

    try {
      // Monthly data
      const monthlyData = this.getMonthlyData();
      this.charts.monthly.data.labels = monthlyData.labels;
      this.charts.monthly.data.datasets[0].data = monthlyData.income;
      this.charts.monthly.data.datasets[1].data = monthlyData.expenses;
      this.charts.monthly.update();

      // Category data
      const categoryData = this.getCategoryData();
      this.charts.category.data.labels = categoryData.labels;
      this.charts.category.data.datasets[0].data = categoryData.values;
      this.charts.category.update();
    } catch (error) {
      console.error("Error updating charts:", error);
    }
  }

  getMonthlyData() {
    const months = {};
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    this.transactions.forEach((t) => {
      const date = new Date(t.date);
      if (date >= sixMonthsAgo) {
        const monthKey = date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        if (!months[monthKey]) {
          months[monthKey] = { income: 0, expenses: 0 };
        }
        if (t.type === "income") {
          months[monthKey].income += t.amount;
        } else {
          months[monthKey].expenses += t.amount;
        }
      }
    });

    // Sort months chronologically
    const sortedKeys = Object.keys(months).sort((a, b) => {
      const [aMonth, aYear] = a.split(" ");
      const [bMonth, bYear] = b.split(" ");
      const aDate = new Date(`${aMonth} 1, ${aYear}`);
      const bDate = new Date(`${bMonth} 1, ${bYear}`);
      return aDate - bDate;
    });

    return {
      labels: sortedKeys,
      income: sortedKeys.map((k) => months[k].income),
      expenses: sortedKeys.map((k) => months[k].expenses),
    };
  }

  getCategoryData() {
    const categoryTotals = {};
    this.transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categoryTotals[t.category] =
          (categoryTotals[t.category] || 0) + t.amount;
      });

    return {
      labels: Object.keys(categoryTotals).map(this.formatCategoryName),
      values: Object.values(categoryTotals),
    };
  }

  isCurrentMonth(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  getCurrentMonthCategoryExpenses() {
    return this.getCategoryExpensesForMonth(new Date());
  }

  getLastMonthCategoryExpenses() {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return this.getCategoryExpensesForMonth(lastMonth);
  }

  getCategoryExpensesForMonth(date) {
    return this.transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          new Date(t.date).getMonth() === date.getMonth() &&
          new Date(t.date).getFullYear() === date.getFullYear()
      )
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});
  }

  getDayOfMonth() {
    return new Date().getDate();
  }

  getDaysInMonth() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }

  getRemainingDaysInMonth() {
    return this.getDaysInMonth() - this.getDayOfMonth();
  }

  getMonthlyExpenseBudget() {
    return Object.values(this.budgetGoals.categories).reduce(
      (sum, amount) => sum + amount,
      0
    );
  }

  updateSummary() {
    if (
      !this.totalIncomeEl ||
      !this.totalExpensesEl ||
      !this.currentBalanceEl
    ) {
      console.warn("Some UI elements are missing. Summary update skipped.");
      return;
    }

    const income = this.transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = this.transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    try {
      this.totalIncomeEl.textContent = `$${income.toFixed(2)}`;
      this.totalExpensesEl.textContent = `$${expenses.toFixed(2)}`;
      this.currentBalanceEl.textContent = `$${balance.toFixed(2)}`;

      this.currentBalanceEl.className = `balance-amount ${
        balance >= 0 ? "income" : "expense"
      }`;

      if (balance < 500 && this.balanceCardEl) {
        this.balanceCardEl.classList.add("warning");
      } else if (this.balanceCardEl) {
        this.balanceCardEl.classList.remove("warning");
      }

      // Update charts and insights if they exist
      if (this.charts) {
        this.updateCharts();
      }
      this.updateInsights();
    } catch (error) {
      console.error("Error updating summary:", error);
    }
  }

  renderTransactions() {
    if (!this.transactionsList) {
      console.warn(
        "Transactions list element not found. Skipping transaction rendering."
      );
      return;
    }

    this.transactionsList.innerHTML = "";

    if (this.transactions.length === 0) {
      this.transactionsList.innerHTML = `
                <div class="text-center py-6">
                    <i class="fas fa-receipt text-gray-400 text-4xl mb-4"></i>
                    <p class="text-gray-500">No transactions yet.</p>
                </div>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    this.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach((transaction) => {
        const transactionEl = document.createElement("div");
        transactionEl.className = `transaction-item ${transaction.type}`;

        const date = new Date(transaction.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        transactionEl.innerHTML = `
                    <div class="transaction-info">
                        <h4>${transaction.description}</h4>
                        <div class="transaction-meta">
                            <span class="date">${date}</span>
                            <span class="category">${
                              transaction.category
                            }</span>
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${
                          transaction.type === "income" ? "+" : "-"
                        }$${transaction.amount.toFixed(2)}
                    </div>
                    <button class="delete-btn" data-id="${transaction.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                `;

        const deleteBtn = transactionEl.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", () =>
          this.deleteTransaction(transaction.id)
        );

        fragment.appendChild(transactionEl);
      });

    this.transactionsList.appendChild(fragment);
  }
}

// Wait for both DOM and all scripts to be loaded
window.addEventListener("load", () => {
  // Check if we're on the budget tracker page before initializing
  const isBudgetTrackerPage =
    window.location.href.includes("Budget_Tracker.html") ||
    document.title.includes("Budget Tracker");

  if (!isBudgetTrackerPage) {
    console.log(
      "Budget Tracker: Not on budget tracker page, skipping initialization"
    );
    return;
  }

  try {
    // Small delay to ensure Chart.js is fully initialized
    setTimeout(() => {
      const budgetTracker = new BudgetTracker();
      console.log("BudgetTracker initialized with elements:", {
        form: budgetTracker.form,
        transactionsList: budgetTracker.transactionsList,
        totalIncome: budgetTracker.totalIncomeEl,
        totalExpenses: budgetTracker.totalExpensesEl,
        currentBalance: budgetTracker.currentBalanceEl,
      });

      if (!budgetTracker.form || !budgetTracker.transactionsList) {
        console.error(
          "Required DOM elements not found. Check if you are on the correct page."
        );
        return;
      }
    }, 100);
  } catch (error) {
    console.error("Error initializing BudgetTracker:", error);
  }
});
