document.addEventListener("DOMContentLoaded", () => {

  const filterButton = document.querySelector(".filter-button");
  const filterSection = document.querySelector(".filter-section");
  const userIcon = document.querySelector(".user-icon");
  const userDropdown = document.querySelector(".user-dropdown");
  const logoutBtn = document.querySelector(".logout-btn");
  const searchInput = document.querySelector(".search-section input");
  const searchButton = document.querySelector(".search-button");

  const modalOverlay = document.querySelector(".recipe-modal-overlay");
  const modal = document.querySelector(".recipe-modal");
  const addRecipeBtn = document.querySelector(".add-recipe-btn");
  const closeBtn = modal.querySelector(".close-button");
  const saveBtn = modal.querySelector(".save-recipe-btn");

  const nameInput = modal.querySelector("#recipe-name");
  const categorySelect = modal.querySelector("#recipe-category");
  const photoInput = modal.querySelector("#recipe-photo");
  const videoInput = modal.querySelector("#video-link");
  const ingredientsList = modal.querySelector(".ingredients-list");
  const stepsList = modal.querySelector(".steps-list");
  const addIngredientBtn = modal.querySelector(".add-ingredient-btn");
  const addStepBtn = modal.querySelector(".add-step-btn");

  const recipeList = document.querySelector(".recipe-list");
  const defaultImage = "/images/default-recipe.jpg";

  const viewOverlay = document.querySelector(".recipe-view-overlay");
  const viewModal = document.querySelector(".recipe-view-modal");

  let editingRecipeId = null;
  let ingredientsDBCache = null;

  const fileToBase64 = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  const fetchIngredientsDB = async () => {
    if (ingredientsDBCache) return ingredientsDBCache;
    const res = await fetch("https://4309909664414cc8.mokky.dev/ingredients");
    const data = await res.json();
    ingredientsDBCache = data || [];
    ingredientsDBCache.forEach((i) => {
      i._nameLower = (i.name || "").toLowerCase().trim();
    });
    return ingredientsDBCache;
  };

  const findIngredientInDBByName = (name) => {
    if (!name) return null;
    const q = name.toLowerCase().trim();
    const db = ingredientsDBCache || [];
    return (
      db.find((i) => i._nameLower === q) ||
      db.find((i) => i._nameLower.includes(q)) ||
      db.find((i) => q.includes(i._nameLower)) ||
      null
    );
  };

  const loadRecipes = () => JSON.parse(localStorage.getItem("recipes") || "[]");
  const saveRecipes = (arr) => localStorage.setItem("recipes", JSON.stringify(arr));
  const getCurrentUser = () => JSON.parse(localStorage.getItem("currentUser") || "null");

  const clearErrors = () => modal.querySelectorAll(".error-message").forEach((el) => el.remove());
  const clearFieldError = (input) => {
    const next = input.nextElementSibling;
    if (next?.classList.contains("error-message")) next.remove();
  };
  const showError = (input, message) => {
    clearFieldError(input);
    const error = document.createElement("div");
    error.classList.add("error-message");
    error.textContent = message;
    input.insertAdjacentElement("afterend", error);
  };

  const getUserRecipes = () => {
    const currentUser = getCurrentUser();
    const all = loadRecipes();
    return all.filter((r) => r.userId === currentUser?.id);
  };

  const createIngredientRow = (name = "", weight = "") => {
    const row = document.createElement("div");
    row.className = "dynamic-row";
    row.innerHTML = `<input type="text" placeholder="Название ингредиента" class="ingredient-name" value="${name}" />
                     <input type="number" placeholder="Масса (г)" class="ingredient-weight" min="1" value="${weight}" />
                     <button type="button" class="remove-btn">×</button>`;
    row.querySelector(".remove-btn").addEventListener("click", () => row.remove());
    return row;
  };

  const createStepRow = (title = "", desc = "") => {
    const row = document.createElement("div");
    row.className = "dynamic-row";
    row.innerHTML = `<input type="text" placeholder="Название шага" class="step-title" value="${title}" />
                     <input type="text" placeholder="Описание шага" class="step-desc" value="${desc}" />
                     <button type="button" class="remove-btn">×</button>`;
    row.querySelector(".remove-btn").addEventListener("click", () => row.remove());
    return row;
  };

  const clearDynamicFields = () => {
    ingredientsList.innerHTML = "";
    stepsList.innerHTML = "";
  };

  addRecipeBtn.addEventListener("click", () => {
    editingRecipeId = null;
    modalOverlay.classList.add("visible");
    modalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    modal.querySelector(".modal-title").textContent = "Создание рецепта";
    saveBtn.textContent = "Сохранить";
    clearErrors();
    clearDynamicFields();
    modal.querySelector("form").reset();
  });

  const closeModal = () => {
    modalOverlay.classList.remove("visible");
    modalOverlay.classList.add("hidden");
    document.body.style.overflow = "";
    clearErrors();
    clearDynamicFields();
    modal.querySelector("form").reset();
    editingRecipeId = null;
  };
  closeBtn.addEventListener("click", closeModal);

  addIngredientBtn.addEventListener("click", () => ingredientsList.appendChild(createIngredientRow()));
  addStepBtn.addEventListener("click", () => stepsList.appendChild(createStepRow()));

  saveBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    clearErrors();

    const name = nameInput.value.trim();
    const category = categorySelect.value;
    const videoLink = videoInput.value.trim();
    const photoFile = photoInput.files[0];

    const ingredients = [];
    const steps = [];
    let hasError = false;

    if (!name) {
      showError(nameInput, "Введите название рецепта");
      hasError = true;
    }

    ingredientsList.querySelectorAll(".dynamic-row").forEach((row) => {
      const nEl = row.querySelector(".ingredient-name");
      const wEl = row.querySelector(".ingredient-weight");
      const n = nEl.value.trim();
      const w = wEl.value.trim();

      if (!n) {
        showError(nEl, "Введите название ингредиента");
        hasError = true;
      }
      if (!w) {
        showError(wEl, "Введите массу");
        hasError = true;
      }

      if (n && w) ingredients.push({ name: n, weight: parseFloat(w) });
    });

    if (ingredients.length === 0) {
      showError(addIngredientBtn, "Добавьте хотя бы один ингредиент");
      hasError = true;
    }

    stepsList.querySelectorAll(".dynamic-row").forEach((row) => {
      const tEl = row.querySelector(".step-title");
      const dEl = row.querySelector(".step-desc");
      const t = tEl.value.trim();
      const d = dEl.value.trim();

      if (!t) {
        showError(tEl, "Введите название шага");
        hasError = true;
      }
      if (!d) {
        showError(dEl, "Введите описание шага");
        hasError = true;
      }

      if (t && d) steps.push({ title: t, desc: d });
    });

    if (steps.length === 0) {
      showError(addStepBtn, "Добавьте хотя бы один шаг");
      hasError = true;
    }

    if (hasError) return;
    let finalImage;

    if (photoFile) {
      finalImage = await fileToBase64(photoFile);
    } else if (editingRecipeId) {
      const all = loadRecipes();
      const oldRecipe = all.find((r) => r.id === editingRecipeId);
      finalImage = oldRecipe?.image || defaultImage;
    } else {
      finalImage = defaultImage;
    }

    if (!ingredientsDBCache) await fetchIngredientsDB();

    let totalCalories = 0;
    const ingredientsWithCals = ingredients.map((it) => {
      const found = findIngredientInDBByName(it.name);
      if (found) {
        const cals = Math.round(found.calories * (it.weight / 100));
        totalCalories += cals;
        return { ...it, caloriesPer100: found.calories, calories: cals };
      }
      return { ...it, caloriesPer100: null, calories: null };
    });
    totalCalories = Math.round(totalCalories);

    const currentUser = getCurrentUser();
    const userId = currentUser?.id;
    const recipes = loadRecipes();

    if (editingRecipeId) {
      const idx = recipes.findIndex((r) => r.id === editingRecipeId);
      if (idx !== -1) {
        recipes[idx] = {
          ...recipes[idx],
          name,
          category,
          image: finalImage,
          video: videoLink || null,
          ingredients: ingredientsWithCals,
          steps,
          calories: totalCalories,
        };
      }
    } else {
      recipes.push({
        id: Date.now(),
        userId,
        name,
        category,
        image: finalImage,
        video: videoLink || null,
        ingredients: ingredientsWithCals,
        steps,
        calories: totalCalories,
      });
    }

    saveRecipes(recipes);
    closeModal();
    renderRecipes(getUserRecipes());
  });

  const renderRecipes = (recipes) => {
    recipeList.innerHTML = "";

    if (!recipes.length) {
      recipeList.innerHTML = `<p style="color:#777;">Нет сохранённых рецептов</p>`;
      return;
    }

    recipes.forEach((r) => {
      const card = document.createElement("div");
      card.className = "recipe-card";

      card.innerHTML = `
        <div class="card-actions">
          <button class="card-btn edit-btn"><img src="/images/edit.svg" /></button>
          <button class="card-btn delete-btn"><img src="/images/delete.svg" /></button>
        </div>

        <img class="recipe-image" src="${r.image}" alt="${r.name}">

        <div class="recipe-info">
          <h4>${r.name}</h4>
          <div class="recipe-meta">
            <span class="category">🍽 ${r.category}</span>
            <span class="calories">🔥 ${r.calories ? r.calories + " ккал" : "—"}</span>
          </div>
        </div>
      `;

      card.addEventListener("click", () => openRecipeView(r));

      card.querySelector(".edit-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        openEditModal(r);
      });

      card.querySelector(".delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        const all = loadRecipes();
        saveRecipes(all.filter((x) => x.id !== r.id));
        renderRecipes(getUserRecipes());
      });

      recipeList.appendChild(card);
    });
  };

  const openEditModal = (recipe) => {
    editingRecipeId = recipe.id;
    modalOverlay.classList.add("visible");
    modalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    modal.querySelector(".modal-title").textContent = "Редактирование рецепта";
    saveBtn.textContent = "Сохранить изменения";

    clearErrors();
    clearDynamicFields();

    nameInput.value = recipe.name;
    categorySelect.value = recipe.category;
    videoInput.value = recipe.video || "";

    recipe.ingredients.forEach((i) => ingredientsList.appendChild(createIngredientRow(i.name, i.weight)));
    recipe.steps.forEach((s) => stepsList.appendChild(createStepRow(s.title, s.desc)));
  };

  (function initSort() {
    const sortDropdown = document.querySelector(".sort-section .dropdown");
    if (!sortDropdown) return;

    const menu = sortDropdown.querySelector(".dropdown-menu");
    const label = sortDropdown.querySelector("span");

    sortDropdown.addEventListener("click", (e) => {
      e.stopPropagation();
      sortDropdown.classList.toggle("open");
    });

    menu.querySelectorAll("li").forEach((item) => {
      item.addEventListener("click", () => {
        const sortType = item.dataset.sort;
        label.textContent = item.textContent;

        const recipes = getUserRecipes();
        let sorted = [...recipes];

        if (sortType === "date-desc") sorted.sort((a, b) => b.id - a.id);
        if (sortType === "date-asc") sorted.sort((a, b) => a.id - b.id);
        if (sortType === "name-asc") sorted.sort((a, b) => a.name.localeCompare(b.name));
        if (sortType === "name-desc") sorted.sort((a, b) => b.name.localeCompare(a.name));

        renderRecipes(sorted);
        sortDropdown.classList.remove("open");
      });
    });

    document.addEventListener("click", (e) => {
      if (!sortDropdown.contains(e.target)) sortDropdown.classList.remove("open");
    });
  })();

  if (userIcon && userDropdown) {
    userIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("visible");
      userIcon.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!userDropdown.contains(e.target) && !userIcon.contains(e.target)) {
        userDropdown.classList.remove("visible");
        userIcon.classList.remove("active");
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      window.location.href = "/index.html";
    });
  }

  if (searchInput && searchButton) {
    searchButton.addEventListener("click", () => {
      const query = searchInput.value.trim().toLowerCase();
      renderRecipes(getUserRecipes().filter((r) => r.name.toLowerCase().includes(query)));
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        searchButton.click();
      }
    });
  }

  (function initFilterHandler() {
    const applyBtn = document.querySelector(".apply-button");
    if (!applyBtn) return;

    applyBtn.addEventListener("click", () => {
      const checked = [...document.querySelectorAll(".filter-section .checkbox:checked")];
      const selectedCategories = checked.map((cb) => cb.value);

      const allRecipes = getUserRecipes();

      let filtered = selectedCategories.length
        ? allRecipes.filter((r) => selectedCategories.includes(r.category))
        : allRecipes;

      const minCal = Number(document.getElementById("calorie-min")?.value) || 0;
      const maxCal = Number(document.getElementById("calorie-max")?.value) || Number.MAX_SAFE_INTEGER;

      filtered = filtered.filter((r) => {
        const cal = Number(r.calories) || 0;
        return cal >= minCal && cal <= maxCal;
      });

      renderRecipes(filtered);
    });
  })();

  if (filterButton && filterSection) {
    filterButton.addEventListener("click", () => {
      filterSection.classList.toggle("hidden");
    });
  }

  renderRecipes(getUserRecipes());

  (function initView() {
    if (!viewOverlay || !viewModal) return;

    const closeViewBtn = viewModal.querySelector(".close-button");
    const prevArrow = document.querySelector(".prev-arrow");
    const nextArrow = document.querySelector(".next-arrow");

    let currentRecipe = null;
    let mode = "preview";
    let currentStep = -1;

    const getYouTubeId = (url) => {
      const patterns = [
        /youtube\.com\/.*v=([^&]+)/,
        /youtu\.be\/([^?]+)/,
        /youtube\.com\/embed\/([^?]+)/,
      ];
      for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
      }
      return null;
    };

    const isYouTubeLink = (url) => /youtu(\.be|be\.com)/.test(url);

    const renderStep = (index) => {
      if (!currentRecipe || !currentRecipe.steps) return;
      if (index < 0 || index >= currentRecipe.steps.length) return;

      mode = "step";
      currentStep = index;

      [".ingredients-section", ".recipe-video-section", ".recipe-meta", ".recipe-view-title", ".recipe-view-image"].forEach((sel) => {
        const el = viewModal.querySelector(sel);
        if (el) el.style.display = "none";
      });

      const existing = viewModal.querySelector(".step-view");
      if (existing) existing.remove();

      const stepBlock = document.createElement("div");
      stepBlock.className = "step-view";
      stepBlock.innerHTML = `
        <div class="step-card">
          <div class="step-header">
            <strong class="step-title"></strong>
            <span class="step-index"></span>
          </div>
          <div class="step-desc"></div>
        </div>
      `;
      viewModal.querySelector(".recipe-view-content").appendChild(stepBlock);

      const step = currentRecipe.steps[index];
      stepBlock.querySelector(".step-title").textContent = step?.title || `Шаг ${index + 1}`;
      stepBlock.querySelector(".step-desc").textContent = step?.desc || "";
      stepBlock.querySelector(".step-index").textContent = `Шаг ${index + 1} из ${currentRecipe.steps.length}`;

      updateArrows();
    };

    const renderPreview = (recipe) => {
      mode = "preview";
      currentStep = -1;
      currentRecipe = recipe;

      [".ingredients-section", ".recipe-video-section", ".recipe-meta", ".recipe-view-title", ".recipe-view-image"].forEach((sel) => {
        const el = viewModal.querySelector(sel);
        if (el) el.style.display = "";
      });

      const stepBlock = viewModal.querySelector(".step-view");
      if (stepBlock) stepBlock.remove();

      viewModal.querySelector(".recipe-view-image").src = recipe.image || defaultImage;
      viewModal.querySelector(".recipe-view-title").textContent = recipe.name;

      viewModal.querySelector(".recipe-meta").innerHTML = `
        <span class="category">Категория: ${recipe.category}</span>
        <span class="calories">Калорийность: ${recipe.calories ?? "—"} ккал</span>
        <span class="steps">Количество шагов: ${recipe.steps.length}</span>
      `;

      const list = viewModal.querySelector(".ingredients-list-view");
        const header = `
          <li class="header">
            <span>Ингредиент</span>
            <span>Масса (г)</span>
            <span>ккал/100г</span>
            <span>Итого</span>
          </li>
        `;
        const rows = recipe.ingredients
          .map((i) => `
            <li>
              <span>${i.name}</span>
              <span>${i.weight}</span>
              <span>${i.caloriesPer100 ?? "—"}</span>
              <span>${i.calories ?? "—"}</span>
            </li>`).join("");
        list.innerHTML = header + rows;

      const video = viewModal.querySelector(".video-container");
      video.innerHTML = "";

      if (recipe.video) {
        if (isYouTubeLink(recipe.video)) {
          const id = getYouTubeId(recipe.video);
          video.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>`;
        } else {
          video.innerHTML = `<a href="${recipe.video}" target="_blank">Открыть видео</a>`;
        }
      } else {
        video.innerHTML = `<p style="color:#777;">Видео не добавлено</p>`;
      }

      updateArrows();
    };

    const updateArrows = () => {
      if (mode === "preview") {
        prevArrow.style.display = "none";
        nextArrow.style.display = currentRecipe.steps.length ? "flex" : "none";
      } else {
        prevArrow.style.display = "flex";
        nextArrow.style.display = currentStep < currentRecipe.steps.length - 1 ? "flex" : "none";
      }
    };

    prevArrow.addEventListener("click", () => {
      if (!currentRecipe) return;
      if (mode === "step") {
        if (currentStep === 0) renderPreview(currentRecipe);
        else renderStep(currentStep - 1);
      }
    });

    nextArrow.addEventListener("click", () => {
      if (!currentRecipe) return;
      if (mode === "preview") renderStep(0);
      else renderStep(currentStep + 1);
    });

    closeViewBtn.addEventListener("click", () => {
      viewOverlay.classList.remove("visible");
      viewOverlay.classList.add("hidden");
      document.body.style.overflow = "";
      currentRecipe = null;
      currentStep = -1;
      mode = "preview";
      const stepBlock = viewModal.querySelector(".step-view");
      if (stepBlock) stepBlock.remove();
    });

    window.openRecipeView = (recipe) => {
      renderPreview(recipe);
      viewOverlay.classList.add("visible");
      viewOverlay.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    };

  })();

  (function initFilterAccordions() {
    const groups = document.querySelectorAll(".filter-group");

    groups.forEach(group => {
      const header = group.querySelector(".filter-header");
      const content = group.querySelector(".filter-content");
      const arrow = group.querySelector(".filter-header img");

      if (!header || !content) return;

      content.style.display = "none";
      arrow.style.transition = "transform 0.3s";

      header.addEventListener("click", () => {
        const isOpen = content.style.display === "block";
        content.style.display = isOpen ? "none" : "block";
        arrow.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
      });
    });

  })();

  fetchIngredientsDB();

});
