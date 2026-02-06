// Global type declarations

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Babel types - simplified declarations to avoid missing type errors
declare module '@babel/generator' {
  const generator: any;
  export = generator;
}

declare module '@babel/template' {
  const template: any;
  export = template;
}

declare module '@babel/traverse' {
  const traverse: any;
  export = traverse;
}

export {};
