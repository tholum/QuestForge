-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "barcode" TEXT,
    "category" TEXT NOT NULL,
    "caloriesPer100g" REAL NOT NULL,
    "proteinPer100g" REAL NOT NULL,
    "carbsPer100g" REAL NOT NULL,
    "fatPer100g" REAL NOT NULL,
    "fiberPer100g" REAL,
    "sugarPer100g" REAL,
    "sodiumPer100g" REAL,
    "servingSize" REAL,
    "servingUnit" TEXT NOT NULL DEFAULT 'g',
    "saturatedFatPer100g" REAL,
    "transFatPer100g" REAL,
    "cholesterolPer100g" REAL,
    "vitaminAPer100g" REAL,
    "vitaminCPer100g" REAL,
    "calciumPer100g" REAL,
    "ironPer100g" REAL,
    "potassiumPer100g" REAL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Food_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FoodLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "mealId" TEXT,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "calories" REAL NOT NULL,
    "protein" REAL NOT NULL,
    "carbs" REAL NOT NULL,
    "fat" REAL NOT NULL,
    "fiber" REAL,
    "sugar" REAL,
    "sodium" REAL,
    "consumedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mealType" TEXT,
    "notes" TEXT,
    "isQuickAdd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FoodLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FoodLog_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FoodLog_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NutritionGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dailyCalories" REAL NOT NULL,
    "dailyProtein" REAL NOT NULL,
    "dailyCarbs" REAL NOT NULL,
    "dailyFat" REAL NOT NULL,
    "dailyFiber" REAL,
    "dailySugar" REAL,
    "dailySodium" REAL,
    "proteinPercentage" REAL,
    "carbsPercentage" REAL,
    "fatPercentage" REAL,
    "goalType" TEXT NOT NULL DEFAULT 'general',
    "activityLevel" TEXT NOT NULL DEFAULT 'moderate',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weeklyWeightGoal" REAL,
    "currentWeight" REAL,
    "targetWeight" REAL,
    "heightCm" REAL,
    "age" INTEGER,
    "gender" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NutritionGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WaterIntake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amountMl" REAL NOT NULL,
    "amountOz" REAL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" DATETIME NOT NULL,
    "source" TEXT,
    "notes" TEXT,
    "temperature" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaterIntake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "plannedTime" DATETIME,
    "consumedTime" DATETIME,
    "totalCalories" REAL NOT NULL DEFAULT 0,
    "totalProtein" REAL NOT NULL DEFAULT 0,
    "totalCarbs" REAL NOT NULL DEFAULT 0,
    "totalFat" REAL NOT NULL DEFAULT 0,
    "totalFiber" REAL DEFAULT 0,
    "totalSugar" REAL DEFAULT 0,
    "totalSodium" REAL DEFAULT 0,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER,
    "notes" TEXT,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealFood" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealFood_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealFood_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Food_name_category_idx" ON "Food"("name", "category");

-- CreateIndex
CREATE INDEX "Food_barcode_idx" ON "Food"("barcode");

-- CreateIndex
CREATE INDEX "Food_userId_isPublic_idx" ON "Food"("userId", "isPublic");

-- CreateIndex
CREATE INDEX "Food_category_isVerified_idx" ON "Food"("category", "isVerified");

-- CreateIndex
CREATE INDEX "FoodLog_userId_consumedAt_idx" ON "FoodLog"("userId", "consumedAt");

-- CreateIndex
CREATE INDEX "FoodLog_userId_mealType_idx" ON "FoodLog"("userId", "mealType");

-- CreateIndex
CREATE INDEX "FoodLog_foodId_idx" ON "FoodLog"("foodId");

-- CreateIndex
CREATE INDEX "FoodLog_mealId_idx" ON "FoodLog"("mealId");

-- CreateIndex
CREATE INDEX "NutritionGoal_userId_isActive_idx" ON "NutritionGoal"("userId", "isActive");

-- CreateIndex
CREATE INDEX "NutritionGoal_userId_startDate_idx" ON "NutritionGoal"("userId", "startDate");

-- CreateIndex
CREATE INDEX "WaterIntake_userId_date_idx" ON "WaterIntake"("userId", "date");

-- CreateIndex
CREATE INDEX "WaterIntake_userId_recordedAt_idx" ON "WaterIntake"("userId", "recordedAt");

-- CreateIndex
CREATE INDEX "Meal_userId_date_idx" ON "Meal"("userId", "date");

-- CreateIndex
CREATE INDEX "Meal_userId_mealType_idx" ON "Meal"("userId", "mealType");

-- CreateIndex
CREATE INDEX "Meal_userId_isTemplate_idx" ON "Meal"("userId", "isTemplate");

-- CreateIndex
CREATE INDEX "MealFood_mealId_orderIndex_idx" ON "MealFood"("mealId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "MealFood_mealId_foodId_key" ON "MealFood"("mealId", "foodId");
