(function (mod) {
  if (typeof window !== 'undefined') window['TextParserV1'] = mod;
  if (typeof global !== 'undefined') global['TextParserV1'] = mod;
  if (typeof module !== 'undefined') module.exports = mod;
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
        if((typeof grammar[2] === "undefined") || (grammar[2] === null)) {
          grammar[2] = it => it;
        }
        this.assert(typeof grammar === "object", `Grammar «${index}» must be object`);
        this.assert(typeof grammar[0] === "string", `Item «0» in grammar «${index}» must be string`);
        this.assert(typeof grammar[1] === "string" || typeof grammar[1] === "object", `Item «1» in grammar «${index}» must be string or object`);
        this.assert(typeof grammar[2] === "function", `Item «2» in grammar «${index}» must be function`);
      }
      this.grammars = grammars;
    }
    parse(text) {
      const tokens = this._extractTokens(text);
      const output = this._processTokens(text, tokens);
      return output;
    }
    _processTokens(text, tokens) {
      const formattedOutput = {size:text.length,text,tokens,formatted:[]};
      Iterating_tokens:
      for(let tokenIndex in tokens) {
        const token = tokens[tokenIndex];
        Iterating_grammars:
        for(let indexGrammar=0; indexGrammar<this.grammars.length; indexGrammar++) {
          const grammar = this.grammars[indexGrammar];
          if(grammar[0] === token.type) {
            const formattedToken = grammar[2].call(this, token, formattedOutput, tokenIndex, grammar, indexGrammar, text);
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
          const [starter, ender] = grammar;
          const isMatchingStarter = text.slice(state.position).startsWith(starter);
          Processing_match:
          if (isMatchingStarter) {
            const countingFrom = state.position + starter.length;
            let offset = 0;
            if (typeof ender === "string") {
              while ((countingFrom + offset) < text.length) {
                const currentPosition = countingFrom + offset;
                const isMatchingEnder = text.slice(currentPosition).startsWith(ender);
                if (isMatchingEnder) {
                  state.output.push({
                    type: starter,
                    location: `${state.position}-${currentPosition+ender.length}`,
                    text: text.substring(state.position, currentPosition+ender.length),
                    inner: text.substring(countingFrom, currentPosition),
                  });
                  break Processing_match;
                }
                offset++;
              }
            } else if(ender === this.constructor.symbols.PARENTHESYS_BALANCE) {
              let openedParenthesys = 1;
              while ((countingFrom + offset) < text.length) {
                const currentPosition = countingFrom + offset;
                // @TODO: meterse dentro de los strings y escapar paréntesis internos
                if(text[currentPosition] === "(") {
                  openedParenthesys++;
                } else if(text[currentPosition] === ")") {
                  openedParenthesys--;
                  if(openedParenthesys === 0) {
                    state.output.push({
                      type: starter,
                      location: `${state.position}-${currentPosition+1}`,
                      text: text.substring(state.position, currentPosition+1),
                      inner: text.substring(countingFrom, currentPosition),
                    });
                    break Processing_match;
                  }
                }
                offset++;
              }
            } else {
              throw new Error(`Ender of grammar ${index} is not valid`);
            }
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