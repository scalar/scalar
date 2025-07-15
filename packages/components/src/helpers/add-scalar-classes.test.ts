import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { addScalarClassesToHeadless } from './add-scalar-classes'

describe('addScalarClassesToHeadless', () => {
  let observer: MutationObserver | undefined

  beforeEach(() => {
    // Clear the document body before each test
    document.body.innerHTML = ''
    observer = undefined
  })

  afterEach(() => {
    // Clean up the observer after each test
    if (observer) {
      observer.disconnect()
    }
    // Clear the document body after each test
    document.body.innerHTML = ''
  })

  describe('when element already exists', () => {
    it('adds the class if the element already exists', () => {
      // Arrange: Create the element and add it to the DOM
      const existingElement = document.createElement('div')
      existingElement.id = 'headlessui-portal-root'
      document.body.appendChild(existingElement)

      // Act: Call the function
      observer = addScalarClassesToHeadless()

      // Assert: The class should be added to the existing element
      expect(existingElement.classList.contains('scalar-app')).toBe(true)
      expect(observer).toBeInstanceOf(MutationObserver)
    })

    it('does not add the class again if element already has it', () => {
      // Arrange: Create the element with the class already present
      const existingElement = document.createElement('div')
      existingElement.id = 'headlessui-portal-root'
      existingElement.classList.add('scalar-app')
      document.body.appendChild(existingElement)

      // Act: Call the function
      observer = addScalarClassesToHeadless()

      // Assert: The class should only appear once
      expect(existingElement.classList.contains('scalar-app')).toBe(true)
      expect(existingElement.classList.length).toBe(1)
    })

    it('adds the class to any HTML element that already exists', () => {
      // Arrange: Create a span element and add it to the DOM
      const spanElement = document.createElement('span')
      spanElement.id = 'headlessui-portal-root'
      document.body.appendChild(spanElement)

      // Act: Call the function
      observer = addScalarClassesToHeadless()

      // Assert: The class should be added to any HTML element type
      expect(spanElement.classList.contains('scalar-app')).toBe(true)
    })

    it('works with different element types', () => {
      // Test section element
      const sectionElement = document.createElement('section')
      sectionElement.id = 'headlessui-portal-root'
      document.body.appendChild(sectionElement)

      observer = addScalarClassesToHeadless()
      expect(sectionElement.classList.contains('scalar-app')).toBe(true)

      // Clean up
      observer.disconnect()
      document.body.removeChild(sectionElement)

      // Test header element
      const headerElement = document.createElement('header')
      headerElement.id = 'headlessui-portal-root'
      document.body.appendChild(headerElement)

      observer = addScalarClassesToHeadless()
      expect(headerElement.classList.contains('scalar-app')).toBe(true)
    })
  })

  describe('when element is added after function runs', () => {
    it('adds the class if the element is added after the function is run', async () => {
      // Arrange: Call the function before the element exists
      observer = addScalarClassesToHeadless()

      // Act: Create and add the element after the observer is set up
      const newElement = document.createElement('div')
      newElement.id = 'headlessui-portal-root'
      document.body.appendChild(newElement)

      // Wait for the MutationObserver to process the change
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Assert: The class should be added to the new element
      expect(newElement.classList.contains('scalar-app')).toBe(true)
    })

    it('handles multiple elements being added at once', async () => {
      // Arrange: Call the function before elements exist
      observer = addScalarClassesToHeadless()

      // Act: Create multiple elements
      const correctElement = document.createElement('div')
      correctElement.id = 'headlessui-portal-root'
      const wrongElement = document.createElement('div')
      wrongElement.id = 'different-id'
      const spanElement = document.createElement('span')
      spanElement.id = 'headlessui-portal-root'

      document.body.appendChild(correctElement)
      document.body.appendChild(wrongElement)
      document.body.appendChild(spanElement)

      // Wait for the MutationObserver to process the changes
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Assert: Only elements with the correct ID should have the class
      expect(correctElement.classList.contains('scalar-app')).toBe(true)
      expect(wrongElement.classList.contains('scalar-app')).toBe(false)
      expect(spanElement.classList.contains('scalar-app')).toBe(true)
    })
  })

  describe('when element is added then removed', () => {
    it('adds the class if the element is added then removed and added again', async () => {
      // Arrange: Call the function
      observer = addScalarClassesToHeadless()

      // Act: Create and add the element
      const element = document.createElement('div')
      element.id = 'headlessui-portal-root'
      document.body.appendChild(element)

      // Wait for the MutationObserver to process the addition
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Assert: The class should be added initially
      expect(element.classList.contains('scalar-app')).toBe(true)

      // Act: Remove the element
      document.body.removeChild(element)

      // Wait for the MutationObserver to process the removal
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Act: Add the element back
      document.body.appendChild(element)

      // Wait for the MutationObserver to process the re-addition
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Assert: The class should still be present
      expect(element.classList.contains('scalar-app')).toBe(true)
    })

    it('adds the class to a new element with the same ID after removal', async () => {
      // Arrange: Call the function
      observer = addScalarClassesToHeadless()

      // Act: Create and add the first element
      const firstElement = document.createElement('div')
      firstElement.id = 'headlessui-portal-root'
      document.body.appendChild(firstElement)

      // Wait for the MutationObserver to process the addition
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Assert: The class should be added to the first element
      expect(firstElement.classList.contains('scalar-app')).toBe(true)

      // Act: Remove the first element
      document.body.removeChild(firstElement)

      // Act: Create and add a new element with the same ID
      const secondElement = document.createElement('div')
      secondElement.id = 'headlessui-portal-root'
      document.body.appendChild(secondElement)

      // Wait for the MutationObserver to process the addition
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Assert: The class should be added to the new element
      expect(secondElement.classList.contains('scalar-app')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('handles when no element exists initially', () => {
      // Act: Call the function when no element exists
      observer = addScalarClassesToHeadless()

      // Assert: Should not throw an error and should return an observer
      expect(observer).toBeInstanceOf(MutationObserver)
    })

    it('adds the class to any HTML element with the correct ID', async () => {
      // Arrange: Call the function
      observer = addScalarClassesToHeadless()

      // Act: Create a span element with the correct ID
      const spanElement = document.createElement('span')
      spanElement.id = 'headlessui-portal-root'
      document.body.appendChild(spanElement)

      // Wait for the MutationObserver to process the addition
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Assert: The class should be added to any HTML element with the correct ID
      expect(spanElement.classList.contains('scalar-app')).toBe(true)
    })

    it('works with different element types added dynamically', async () => {
      // Arrange: Call the function
      observer = addScalarClassesToHeadless()

      // Act: Test section element
      const sectionElement = document.createElement('section')
      sectionElement.id = 'headlessui-portal-root'
      document.body.appendChild(sectionElement)

      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(sectionElement.classList.contains('scalar-app')).toBe(true)

      // Clean up
      document.body.removeChild(sectionElement)

      // Test header element
      const headerElement = document.createElement('header')
      headerElement.id = 'headlessui-portal-root'
      document.body.appendChild(headerElement)

      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(headerElement.classList.contains('scalar-app')).toBe(true)
    })

    it('ignores elements with incorrect ID', async () => {
      // Arrange: Call the function
      observer = addScalarClassesToHeadless()

      // Act: Create elements with the wrong ID
      const divElement = document.createElement('div')
      divElement.id = 'wrong-id'
      const spanElement = document.createElement('span')
      spanElement.id = 'different-id'

      document.body.appendChild(divElement)
      document.body.appendChild(spanElement)

      // Wait for the MutationObserver to process the addition
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Assert: The class should not be added to elements with wrong ID
      expect(divElement.classList.contains('scalar-app')).toBe(false)
      expect(spanElement.classList.contains('scalar-app')).toBe(false)
    })

    it('ignores non-HTML elements', async () => {
      // Arrange: Call the function
      observer = addScalarClassesToHeadless()

      // Act: Create a text node and add it to the DOM
      const textNode = document.createTextNode('test text')
      document.body.appendChild(textNode)

      // Wait for the MutationObserver to process the addition
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Assert: Non-HTML elements should be ignored (no error thrown)
      expect(document.body.textContent).toBe('test text')
    })

    it('can be called multiple times without issues', async () => {
      // Act: Call the function multiple times
      const observer1 = addScalarClassesToHeadless()
      const observer2 = addScalarClassesToHeadless()

      // Create an element
      const element = document.createElement('div')
      element.id = 'headlessui-portal-root'
      document.body.appendChild(element)

      // Wait for the MutationObservers to process the addition
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Assert: The class should be added and both observers should work
      expect(element.classList.contains('scalar-app')).toBe(true)
      expect(observer1).toBeInstanceOf(MutationObserver)
      expect(observer2).toBeInstanceOf(MutationObserver)

      // Clean up the additional observer
      observer1.disconnect()
      observer2.disconnect()
    })
  })

  describe('observer functionality', () => {
    it('returns a working MutationObserver instance', () => {
      // Act: Call the function
      observer = addScalarClassesToHeadless()

      // Assert: Should return a MutationObserver instance
      expect(observer).toBeInstanceOf(MutationObserver)
      expect(typeof observer.disconnect).toBe('function')
      expect(typeof observer.observe).toBe('function')
    })

    it('stops observing when disconnected', async () => {
      // Arrange: Call the function and disconnect the observer
      observer = addScalarClassesToHeadless()
      observer.disconnect()

      // Act: Create and add an element
      const element = document.createElement('div')
      element.id = 'headlessui-portal-root'
      document.body.appendChild(element)

      // Wait for potential MutationObserver processing
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Assert: The class should not be added since observer was disconnected
      expect(element.classList.contains('scalar-app')).toBe(false)
    })
  })
})
