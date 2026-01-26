import { left, right, type Either } from "@/core/either";

function doSomething(input: boolean): Either<string, number> {
  if (input) {
    return right(10);
  } else {
    return left("Input is false");
  }
}

test("success result", () => {
  const success = doSomething(true);

  expect(success.isLeft()).toBe(false);
  expect(success.isRight()).toBe(true);
});

test("error result", () => {
  const success = doSomething(false);

  expect(success.isLeft()).toBe(true);
  expect(success.isRight()).toBe(false);
});
