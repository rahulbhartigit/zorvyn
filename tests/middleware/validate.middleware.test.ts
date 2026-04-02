import { validate } from "../../src/middleware/validate.js";
import { z } from "zod";
import { jest } from "@jest/globals";

describe("Validate Middleware", () => {
  const schema = z.object({
    name: z.string().min(3),
    age: z.number().int().positive(),
  });

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it("returns 422 if validation fails", () => {
    const req: any = { body: { name: "A", age: -10 } };
    const res = mockResponse();
    const next = jest.fn();

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Validation failed",
      errors: expect.any(Object),
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("replaces req.body with parsed/coerced data and calls next", () => {
    const req: any = { body: { name: "John", age: 30, extra: "field" } };
    const res = mockResponse();
    const next = jest.fn();

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(req.body).toEqual({ name: "John", age: 30 }); // extra field is stripped
    expect(next).toHaveBeenCalled();
  });
});
