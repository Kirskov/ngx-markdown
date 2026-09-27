import { NGX_MARKDOWN_TRUSTED_TYPES_POLICY, trustedHtml, ɵresetTrustedTypesPolicyForTesting } from './trusted-html';

interface TrustedTypesStub {
  createPolicy: jasmine.Spy;
}

describe('TrustedHtml', () => {
  const globalRef = globalThis as { trustedTypes?: unknown };
  let originalDescriptor: PropertyDescriptor | undefined;

  const setTrustedTypes = (value: unknown): void => {
    Object.defineProperty(globalRef, 'trustedTypes', {
      value,
      configurable: true,
      writable: true,
    });
  };

  beforeEach(() => {
    originalDescriptor = Object.getOwnPropertyDescriptor(globalRef, 'trustedTypes');
    ɵresetTrustedTypesPolicyForTesting();
  });

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(globalRef, 'trustedTypes', originalDescriptor);
    } else {
      delete globalRef.trustedTypes;
    }
    ɵresetTrustedTypesPolicyForTesting();
  });

  it('should return the html unchanged when Trusted Types are not supported', () => {
    setTrustedTypes(undefined);

    expect(trustedHtml('<p>value</p>')).toBe('<p>value</p>');
  });

  it('should return the html unchanged when the policy cannot be created', () => {
    const trustedTypes: TrustedTypesStub = {
      createPolicy: jasmine.createSpy('createPolicy').and.throwError('policy is disallowed'),
    };
    setTrustedTypes(trustedTypes);

    expect(trustedHtml('<p>value</p>')).toBe('<p>value</p>');
    expect(trustedTypes.createPolicy).toHaveBeenCalled();
  });

  it('should create a policy named after the library and use it', () => {
    const createHTML = jasmine.createSpy('createHTML').and.returnValue('trusted-value');
    const trustedTypes: TrustedTypesStub = {
      createPolicy: jasmine.createSpy('createPolicy').and.returnValue({ createHTML }),
    };
    setTrustedTypes(trustedTypes);

    expect(trustedHtml('<p>value</p>')).toBe('trusted-value');
    expect(trustedTypes.createPolicy).toHaveBeenCalledWith(NGX_MARKDOWN_TRUSTED_TYPES_POLICY, jasmine.any(Object));
    expect(createHTML).toHaveBeenCalledWith('<p>value</p>');
  });

  it('should pass the html through unmodified when creating the trusted value', () => {
    let rules: { createHTML(input: string): string } | undefined;
    const trustedTypes: TrustedTypesStub = {
      createPolicy: jasmine.createSpy('createPolicy').and.callFake(
        (_name: string, policyRules: { createHTML(input: string): string }) => {
          rules = policyRules;
          return { createHTML: policyRules.createHTML };
        },
      ),
    };
    setTrustedTypes(trustedTypes);

    expect(trustedHtml('<p>value</p>')).toBe('<p>value</p>');
    expect(rules!.createHTML('&lt;html&gt;')).toBe('&lt;html&gt;');
  });

  it('should create the policy only once', () => {
    const trustedTypes: TrustedTypesStub = {
      createPolicy: jasmine.createSpy('createPolicy').and.returnValue({
        createHTML: (html: string) => html,
      }),
    };
    setTrustedTypes(trustedTypes);

    trustedHtml('one');
    trustedHtml('two');

    expect(trustedTypes.createPolicy).toHaveBeenCalledTimes(1);
  });
});
