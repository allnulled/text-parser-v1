(function (mod) {
  if (typeof window !== 'undefined') window['TextParserV1'] = mod;
  if (typeof global !== 'undefined') global['TextParserV1'] = mod;
  // if (typeof module !== 'undefined') module.exports = mod;
  return mod;
})(function () {
  // @source: https://github.com/allnulled/text-parser-v1/blob/main/text-parser-v1.js
  const TextParserV1 = class TextParserV1 {
    static default = this;
    static symbols = {
      PARENTHESYS_BALANCE: {},
    }
    static create(grammars) {
      return new this(grammars);
    }
    debug(...args) {
      console.log("[DEBUG]", ...args);
    }
    assert(condition, message) {
      if (!condition) throw new Error(message);
    }
    constructor(grammars = []) {
      for (let index = 0; index < grammars.length; index++) {
        const grammar = grammars[index];
        if ((typeof grammar[2] === "undefined") || (grammar[2] === null)) {
          grammar[2] = it => it;
        }
        if ((typeof grammar[3] === "undefined") || (grammar[3] === null)) {
          grammar[3] = {
            allowInside: false,
            includeAppendix: undefined,
          };
        }
        this.assert(typeof grammar === "object", `Grammar «${index}» must be object`);
        this.assert(typeof grammar[0] === "string", `Item «0» in grammar «${index}» must be string`);
        this.assert(typeof grammar[1] === "string" || typeof grammar[1] === "object", `Item «1» in grammar «${index}» must be string or object`);
        this.assert(typeof grammar[2] === "function", `Item «2» in grammar «${index}» must be function`);
        this.assert(typeof grammar[3] === "object", `Item «3» in grammar «${index}» must be object`);
        if(("allowInside" in grammar[3]) && (typeof grammar[3].allowInside !== "undefined")) {
          this.assert(typeof grammar[3].allowInside === "boolean", `Property «allowInside» in item «3» in grammar «${index}» must be boolean or none`);
        }
        if(("includeAppendix" in grammar[3]) && (typeof grammar[3].includeAppendix !== "undefined")) {
          if(Array.isArray(grammar[3].includeAppendix)) {
            for(let appendixIndex=0; appendixIndex<grammar[3].includeAppendix.length; appendixIndex++) {
              this.assert(["string","function"].includes(typeof grammar[3].includeAppendix[appendixIndex]), `Property «includeAppendix» in item «3» in grammar «${index}» and in index «${appendixIndex}» must be string or function or none`);
            }
          } else {
            this.assert(["string","function"].includes(typeof grammar[3].includeAppendix), `Property «includeAppendix» in item «3» in grammar «${index}» must be array, string or function or none`);
          }
        }
      }
      this.grammars = grammars;
    }
    parse(text) {
      const tokens = this._extractTokens(text);
      const output = this._processTokens(text, tokens);
      return output;
    }
    _getAppendixOffset(text, grammar, currentPosition, ender) {
      const allAppendixes = Array.isArray(grammar[3].includeAppendix) ? grammar[3].includeAppendix : [grammar[3].includeAppendix];
      for(let appendixIndex=0; appendixIndex<allAppendixes.length; appendixIndex++) {
        const oneAppendix = allAppendixes[appendixIndex];
        if(text.startsWith(oneAppendix, currentPosition + ender.length)) {
          return oneAppendix.length;
        }
      }
      return 0;
    }
    _pushToken({ state, starter, currentPosition, countingFrom, enderLength, text, extraOffset }) {
      const lastPosition = currentPosition + enderLength + extraOffset;
      return state.output.push({
        type: starter,
        location: [state.position, lastPosition],
        text: text.substring(state.position, lastPosition),
        inner: text.substring(countingFrom, currentPosition),
        outer: text.substring(state.position, lastPosition),
      });
    }
    _processTokens(text, tokens) {
      const formattedOutput = { size: text.length, text, tokens, formatted: [] };
      Iterating_tokens:
      for (let indexToken = 0; indexToken < tokens.length; indexToken++) {
        const token = tokens[indexToken];
        Iterating_grammars:
        for (let indexGrammar = 0; indexGrammar < this.grammars.length; indexGrammar++) {
          const grammar = this.grammars[indexGrammar];
          if (grammar[0] === token.type) {
            const formattedToken = grammar[2].call(this, token, formattedOutput, indexToken, grammar, indexGrammar, text);
            formattedOutput.formatted.push(formattedToken);
            break Iterating_grammars;
          }
        }
      }
      return formattedOutput;
    }
    _extractTokens(text) {
      const state = {
        position: 0,
        output: [],
      };
      Iterating_text:
      while (state.position < text.length) {
        Iterating_grammars:
        for (let index = 0; index < this.grammars.length; index++) {
          const grammar = this.grammars[index];
          const [starter, ender, formatter, options] = grammar;
          const isMatchingStarter = text.startsWith(starter, state.position);
          On_not_matched:
          if (!isMatchingStarter) {
            continue Iterating_grammars;
          }
          const countingFrom = state.position + starter.length;
          let offset = 0;
          let wasEnded = false;
          Processing_match:
          if (typeof ender === "string") {
            while ((countingFrom + offset) < text.length) {
              const currentPosition = countingFrom + offset;
              const isMatchingEnder = text.startsWith(ender, currentPosition);
              if (isMatchingEnder) {
                wasEnded = true;
                this._pushToken({ state, starter, currentPosition, countingFrom, text, enderLength: ender.length, extraOffset: this._getAppendixOffset(text, grammar, currentPosition, ender) });
                break Processing_match;
              }
              offset++;
            }
            if (!wasEnded) throw new Error(`Unclosed starter of grammar «${starter}» reached end of text but «${ender}» was not found on grammar index «${index}»`);
          } else if (ender === this.constructor.symbols.PARENTHESYS_BALANCE) {
            let openedParenthesys = 1;
            let wasEnded = false;
            while ((countingFrom + offset) < text.length) {
              const currentPosition = countingFrom + offset;
              // @TODO: meterse dentro de los strings y escapar paréntesis internos
              if (text[currentPosition] === "(") {
                openedParenthesys++;
              } else if (text[currentPosition] === ")") {
                openedParenthesys--;
                if (openedParenthesys === 0) {
                  wasEnded = true;
                  this._pushToken({ state, starter, currentPosition, countingFrom, text, enderLength: 0, extraOffset: this._getAppendixOffset(text, grammar, currentPosition, ender) });
                  break Processing_match;
                }
              }
              offset++;
            }
            if (!wasEnded) throw new Error(`Unclosed starter of grammar «${starter}» reached end of text but the first parenthesys was not closed on grammar index «${index}»`);
          } else {
            throw new Error(`Ender (2nd argument) of grammar «${starter}» at grammar index «${index}» has not valid type: «${typeof ender}»`);
          }
          if (options.allowInside) {
            state.position += starter.length;
          } else {
            state.position += offset;
          }
        }
        state.position++;
      }
      return state.output;
    }
  };
  return TextParserV1;
}.call());