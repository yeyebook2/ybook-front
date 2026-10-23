import { describe, it, expect } from "vitest"

describe("Epub.js & Reader Robustness — Prevention of TypeError: can't access property 'indexOf'", () => {
  it("Path handles undefined, null, non-string without throwing indexOf error", async () => {
    // @ts-expect-error submodule import
    const PathModule = await import("epubjs/lib/utils/path")
    const Path = PathModule.default || PathModule

    // Test Path constructor with undefined, null, empty string
    expect(() => new Path(undefined as any)).not.toThrow()
    const pUndefined = new Path(undefined as any)
    expect(pUndefined.path).toBe("")
    expect(pUndefined.extension).toBe("")
    expect(pUndefined.directory).toBe("/")

    expect(() => new Path(null as any)).not.toThrow()
    const pNull = new Path(null as any)
    expect(pNull.path).toBe("")

    expect(() => new Path("")).not.toThrow()
    const pEmpty = new Path("")
    expect(pEmpty.path).toBe("")

    // Test Path.relative with undefined
    expect(() => pUndefined.relative(undefined as any)).not.toThrow()
    expect(pUndefined.relative(undefined as any)).toBe("")

    // Test Path.isDirectory with undefined
    expect(() => pUndefined.isDirectory(undefined as any)).not.toThrow()
    expect(pUndefined.isDirectory(undefined as any)).toBe(false)
  })

  it("Url handles undefined, null, non-string without throwing indexOf error", async () => {
    // @ts-expect-error submodule import
    const UrlModule = await import("epubjs/lib/utils/url")
    const Url = UrlModule.default || UrlModule

    expect(() => new Url(undefined as any)).not.toThrow()
    const urlUndefined = new Url(undefined as any)
    expect(urlUndefined.href).toBe("")

    expect(() => new Url(null as any)).not.toThrow()
    const urlNull = new Url(null as any)
    expect(urlNull.href).toBe("")

    expect(() => new Url("")).not.toThrow()

    // Test Url.resolve with undefined
    expect(() => urlUndefined.resolve(undefined as any)).not.toThrow()
    expect(urlUndefined.resolve(undefined as any)).toBe("")

    // Test Url.relative with undefined
    expect(() => urlUndefined.relative(undefined as any)).not.toThrow()
    expect(urlUndefined.relative(undefined as any)).toBe("")
  })

  it("Book.resolve handles undefined and non-string without throwing", async () => {
    // @ts-expect-error submodule import
    const BookModule = await import("epubjs/lib/book")
    const Book = BookModule.default || BookModule

    // Mock minimal book instance
    const book = Object.create(Book.prototype)
    expect(() => book.resolve(undefined)).not.toThrow()
    expect(book.resolve(undefined)).toBe("")
    expect(() => book.resolve(null)).not.toThrow()
    expect(book.resolve(null)).toBe("")
    expect(() => book.resolve("")).not.toThrow()
    expect(book.resolve("")).toBe("")
  })
})
