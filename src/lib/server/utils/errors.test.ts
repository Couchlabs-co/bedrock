import { describe, it, expect } from "vitest";
import { AppError, notFound, badRequest, unauthorized, forbidden, validationError } from "./errors";

describe("AppError", () =>
{
    it("should create an error with defaults", () =>
    {
        const err = new AppError("Something broke");
        expect(err.message).toBe("Something broke");
        expect(err.statusCode).toBe(500);
        expect(err.code).toBe("INTERNAL_ERROR");
        expect(err.details).toBeUndefined();
    });

    it("should serialise to JSON", () =>
    {
        const err = new AppError("Bad input", 400, "BAD_REQUEST", { field: "missing" });
        const json = err.toJSON();
        expect(json).toEqual({
            error: "Bad input",
            code: "BAD_REQUEST",
            details: { field: "missing" },
        });
    });
});

describe("error factories", () =>
{
    it("notFound returns 404", () =>
    {
        const err = notFound();
        expect(err.statusCode).toBe(404);
        expect(err.code).toBe("NOT_FOUND");
    });

    it("badRequest returns 400 with details", () =>
    {
        const err = badRequest("Invalid price", { price: "Must be a number" });
        expect(err.statusCode).toBe(400);
        expect(err.details).toEqual({ price: "Must be a number" });
    });

    it("unauthorized returns 401", () =>
    {
        expect(unauthorized().statusCode).toBe(401);
    });

    it("forbidden returns 403", () =>
    {
        expect(forbidden().statusCode).toBe(403);
    });

    it("validationError returns 422 with details", () =>
    {
        const err = validationError({ email: "required", name: "too short" });
        expect(err.statusCode).toBe(422);
        expect(err.code).toBe("VALIDATION_ERROR");
        expect(err.details).toEqual({ email: "required", name: "too short" });
    });
});
