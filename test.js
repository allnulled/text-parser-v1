const TextParserV1 = require(`${__dirname}/text-parser-v1.js`);

const parser = TextParserV1.create([
  ["$inject.source(", TextParserV1.symbols.PARENTHESYS_BALANCE, (token) => {
    return { type: "Inject Source", inner: token.inner, location: token.location };
  }],
  ["$inject.string(", TextParserV1.symbols.PARENTHESYS_BALANCE, (token) => {
    return { type: "Inject String", inner: token.inner, location: token.location };
  }],
  ["$import.js(", TextParserV1.symbols.PARENTHESYS_BALANCE, (token) => {
    return { type: "Import Js", inner: token.inner, location: token.location };
  }],
  ["$export.js(", TextParserV1.symbols.PARENTHESYS_BALANCE, (token) => {
    return { type: "Export Js", inner: token.inner, location: token.location };
  }],
  ["$export.css(", TextParserV1.symbols.PARENTHESYS_BALANCE, (token) => {
    return { type: "Export Css", inner: token.inner, location: token.location };
  }],
  ["/*%", "%*/", (token) => {
    return { type: "Multiline Comment Code Injection", inner: token.inner, location: token.location };
  }],
  ["/*%=", "%*/", (token) => {
    return { type: "Multiline Comment Value Injection", inner: token.inner, location: token.location };
  }],
  ["/*@requires:", "*/", (token) => {
    return { type: "Requires", inner: token.inner, location: token.location };
  }],
  ["/*@injects:", "*/", (token) => {
    return { type: "Injects", inner: token.inner, location: token.location };
  }],
  ["/**", "*/", (token) => {
    return { type: "Javadoc Comment", inner: token.inner, location: token.location };
  }],
]);

const output1 = parser.parse(`
/**
 * @name Some name
 * @description Some description
 */
module.exports = {
  a: $inject.source("some/path.js", { some: "parameters" }),
  b: $inject.source("some/path.js", { some: "parameters" }),
  c: $inject.source("some/path.js", { some: "parameters" }),
};
`);
const formatted1 = output1.formatted;

parser.assert(typeof formatted1[0] === "object", "Outputs a list of objects ( point 1 )");
parser.assert(typeof formatted1[1] === "object", "Outputs a list of objects ( point 2 )");
parser.assert(typeof formatted1[2] === "object", "Outputs a list of objects ( point 3 )");
parser.assert(typeof formatted1[3] === "object", "Outputs a list of objects ( point 4 )");
parser.assert(formatted1[0].type === "Javadoc Comment", "Catches javadoc comments ( point 5 )");

Ejemplo_del_readme: {
  const matches = TextParserV1.create([
    ["/*", "*/", (token, output, index, grammar, grammarIndex, text) => {
      return { type: "multiline", loc: token.location.join("-") };
    }],
    ["//", "\n", (token, output, index, grammar, grammarIndex, text) => {
      return { type: "oneline", loc: token.location.join("-") };
    }],
  ]).parse(`
// All comments will be catched
/* One line and multiline comments */
`);
  console.log(JSON.stringify(matches, null, 2));
}

Ejemplo_de_fallo_por_no_cierre: {
  let passed = false;
  try {
    parser.parse("/**y aqui da igual pero si no cierras se queja");
  } catch (error) {
    parser.assert(error.message.startsWith("Unclosed starter of grammar"));
    passed = true;
  }
  parser.assert(passed, `Debe fallar por ausencia de gramática de cierre en gramáricas de final hardcodeado`);
}

Ejemplo_de_fallo_por_no_cierre_en_balanceo_de_parentesis: {
  let passed = false;
  try {
    parser.parse("$inject.source(y aqui da igual excepto porque no cierras");
  } catch (error) {
    parser.assert(error.message.startsWith("Unclosed starter of grammar"));
    passed = true;
  }
  parser.assert(passed, `Debe fallar por ausencia de gramática de cierre en gramaticas de parentesis balanceados`);
}