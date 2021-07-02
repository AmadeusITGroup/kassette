////////////////////////////////////////////////////////////////////////////////
// Models
////////////////////////////////////////////////////////////////////////////////

export type InputOrigin = 'none' | 'default' | 'user';

export interface ProcessorArg<Input> {
  input: Input | undefined;
  inputOrigin: InputOrigin;
}

export interface UserPropertySpec<Input, Output> {
  getDefaultInput?(): Input;
  transform?(arg: ProcessorArg<Input>): Output;
}

export interface PropertyCache<Type> {
  value: Type | undefined;
  invalid: boolean;
}

////////////////////////////////////////////////////////////////////////////////
// Implementation
////////////////////////////////////////////////////////////////////////////////

export class UserProperty<Input, Output = Input> {
  //////////////////////////////////////////////////////////////////////////////
  //
  //////////////////////////////////////////////////////////////////////////////

  private _userInputIsSet = false;
  private _userInput: Input | undefined;

  private _inputCache: PropertyCache<ProcessorArg<Input>> = {
    value: undefined,
    invalid: true,
  };

  private _outputCache: PropertyCache<Output> = {
    value: undefined,
    invalid: true,
  };

  constructor(private _spec: UserPropertySpec<Input, Output> = {}) {}

  //////////////////////////////////////////////////////////////////////////////
  //
  //////////////////////////////////////////////////////////////////////////////

  set(value: Input) {
    this._userInputIsSet = true;
    this._userInput = value;
    this.resetInputCache();
  }

  unset() {
    this._userInputIsSet = false;
    this._userInput = undefined;
    this.resetInputCache();
  }

  //////////////////////////////////////////////////////////////////////////////
  // Input
  //////////////////////////////////////////////////////////////////////////////

  public get inputAndOrigin(): ProcessorArg<Input> {
    if (!this._inputCache.invalid) {
      return this._inputCache.value!;
    }

    let input: Input | undefined;
    let origin: InputOrigin;

    if (this.userInputIsSet) {
      origin = 'user';
      input = this.userInput;
    } else if (this._spec.getDefaultInput != null) {
      origin = 'default';
      input = this._spec.getDefaultInput();
    } else {
      origin = 'none';
    }

    const value = { input, inputOrigin: origin };
    this._inputCache.value = value;
    this._inputCache.invalid = false;
    return value;
  }

  get userInputIsSet(): boolean {
    return this._userInputIsSet;
  }
  get userInput(): Input | undefined {
    return this._userInput;
  }
  get hasDefaultInput(): boolean {
    return this._spec.getDefaultInput != null;
  }
  get defaultInput(): Input | undefined {
    if (this._spec.getDefaultInput != null) {
      return this._spec.getDefaultInput();
    }
  }
  get input(): Input | undefined {
    return this.inputAndOrigin.input;
  }
  get inputOrigin(): InputOrigin {
    return this.inputAndOrigin.inputOrigin;
  }

  resetInputCache() {
    this._inputCache.invalid = true;
    this._inputCache.value = undefined;
    this.resetOutputCache();
  }

  //////////////////////////////////////////////////////////////////////////////
  // Output
  //////////////////////////////////////////////////////////////////////////////

  get output(): Output {
    if (!this._outputCache.invalid) {
      return this._outputCache.value!;
    }

    let transform = this._spec.transform;
    if (transform == null) {
      transform = ({ input }: ProcessorArg<Input>): any => input;
    }

    const value = transform(this.inputAndOrigin);
    this._outputCache.value = value;
    this._outputCache.invalid = false;
    return value;
  }

  resetOutputCache() {
    this._outputCache.invalid = true;
    this._outputCache.value = undefined;
  }
}
