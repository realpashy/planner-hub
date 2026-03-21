import { readFile } from "fs/promises";
import path from "path";

export interface DatasetMeal {
  id: string;
  title: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  dietTypes: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  effort: "low" | "medium" | "high";
  budget: "low" | "medium" | "high";
  ingredients: string[];
  exclusions: string[];
  tags: string[];
  image: string;
  imageType: "emoji" | "static" | "generated" | "upload" | "local";
  imageSource: string;
  isFavorite?: boolean;
  isTemplate?: boolean;
}

let catalogPromise: Promise<DatasetMeal[]> | null = null;

export function getMealDataset() {
  if (!catalogPromise) {
    catalogPromise = readFile(path.resolve(process.cwd(), "data", "meal-dataset.json"), "utf8").then((raw) =>
      JSON.parse(raw) as DatasetMeal[],
    );
  }
  return catalogPromise;
}
