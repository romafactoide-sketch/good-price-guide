import { describe, expect, it } from "vitest";
import {
  canCreateBusiness,
  canCreateIngredient,
  canCreateProduct,
  canUseFeature,
  getPlanLimits,
  requiredPlanFor,
} from "./plans";

describe("limites por plano", () => {
  it("free permite 3 produtos e 5 insumos", () => {
    expect(getPlanLimits("free")).toEqual({ businesses: 1, products: 3, ingredients: 5 });
    expect(canCreateProduct("free", 2).allowed).toBe(true);
    expect(canCreateProduct("free", 3).allowed).toBe(false);
    expect(canCreateProduct("free", 3).message).toBe("Seu plano gratuito permite até 3 produtos.");
    expect(canCreateIngredient("free", 4).allowed).toBe(true);
    expect(canCreateIngredient("free", 5).allowed).toBe(false);
  });

  it("pro é ilimitado em produtos e insumos", () => {
    expect(canCreateProduct("pro", 500).allowed).toBe(true);
    expect(canCreateIngredient("pro", 500).remaining).toBeNull();
    expect(canCreateBusiness("pro", 1).allowed).toBe(false);
    expect(canCreateBusiness("business", 9).allowed).toBe(true);
  });
});

describe("recursos por plano", () => {
  it("free tem calculadora, margem e markup", () => {
    expect(canUseFeature("free", "pricing_calculator")).toBe(true);
    expect(canUseFeature("free", "margin")).toBe(true);
    expect(canUseFeature("free", "markup")).toBe(true);
  });

  it("free não tem alertas, simuladores nem canais", () => {
    expect(canUseFeature("free", "alerts")).toBe(false);
    expect(canUseFeature("free", "simulators")).toBe(false);
    expect(canUseFeature("free", "channel_pricing")).toBe(false);
    expect(canUseFeature("pro", "alerts")).toBe(true);
  });

  it("recursos de múltiplos negócios exigem o plano Negócio", () => {
    expect(canUseFeature("pro", "multi_business")).toBe(false);
    expect(requiredPlanFor("multi_business")).toBe("business");
    expect(requiredPlanFor("alerts")).toBe("pro");
    expect(requiredPlanFor("margin")).toBe("free");
  });
});
