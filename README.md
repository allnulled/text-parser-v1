# Instrucciones

## Requisitos

Importar `text-parser-v1.js`.

## Uso

```js
Ejemplo_del_readme: {
  const matches = TextParserV1.create(grammars1.concat([
    ["//", "\n", null, { /*defaults*/ }],
    ["/*", "*/", null, { allowInside: true }],
  ])).parse(`
    // All comments will be catched (except when oneline command in last line of document)
    /*
      Multiline comments // can catch inner oneline-comments
      Why? // because of the allowInside:true in the options
      Really? // Yes, this is the 5th inyection detected + 1 lasting = 6 tokens captured
    */
    $inject.source(y aqui lo que sea)
  `);
  parser.assert(matches.formatted.length === 6, "Tokenizes default grammars + 2 new improvised grammars");
  // console.log(JSON.stringify(matches, null, 2));
}
```

Generaría una salida como la de [output.txt](./output.txt).

## Método parse

La firma del método `TextParserV1.prototype.parse(...)` es:

- `start:String`
- `end:String|TextParserV1.symbols.PARENTHESYS_BALANCE`
- `formatter:Function`

La firma del parámetro `formatter:Function` es:

- `this:TextParserV1`
- `token:String`
- `output:Object`
- `indexToken:Integer`
- `grammar:Object`
- `indexGrammar:Integer`
- `text:String`

## Test de ejemplo

El test de ejemplo es este:

```js
require(`${__dirname}/text-parser-v1.js`);

const grammars1 = [
  ["$inject.source(", TextParserV1.symbols.PARENTHESYS_BALANCE, (token) => {
    return { type: "Inject Source", inner: token.inner, location: token.location };
  }],
  ["$inject.string(", TextParserV1.symbols.PARENTHESYS_BALANCE, (token) => {
    return { type: "Inject String", inner: token.inner, location: token.location };
  }],
  ["$import.js(", TextParserV1.symbols.PARENTHESYS_BALANCE, (token) => {
    return { type: "Import Js", inner: token.inner, location: token.location };
  }, {allowInside:true}],
  ["$export.js(", TextParserV1.symbols.PARENTHESYS_BALANCE, (token) => {
    return { type: "Export Js", inner: token.inner, location: token.location };
  }, {allowInside:true}],
  ["$export.css(", TextParserV1.symbols.PARENTHESYS_BALANCE, (token) => {
    return { type: "Export Css", inner: token.inner, location: token.location };
  }, {allowInside:true}],
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
  }, {allowInside:true}],
];

const parser = TextParserV1.create(grammars1);

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
  const matches = TextParserV1.create(grammars1.concat([
    ["//", "\n", null, { allowInside: false }],
    ["/*", "*/", null, { allowInside: true }],
  ])).parse(`
    // All comments will be catched (except when oneline command in last line of document)
    /*
      Multiline comments // can catch inner oneline-comments
      Why? // because of the allowInside:true in the options
      Really? // Yes, this is the 5th inyection detected + 1 lasting = 6 tokens captured
    */
    $inject.source(y aqui lo que sea)
  `);
  parser.assert(matches.formatted.length === 6, "Tokenizes default grammars + 2 new improvised grammars");
  // console.log(JSON.stringify(matches, null, 2));
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

Ejemplo_de_gramaticas_superpuestas: {
  const output1 = parser.parse(`$import.js(["./a1.js", "./b1.js", "./c1.js"], function(a,b,c) {
    return {
      previous: [a,b,c],
      a: $inject.source("./i1.js"),
      b: $inject.source("./i2.js"),
      c: $inject.source("./i3.js"),
    };
  });`);
  parser.assert(output1.tokens.length === 4, "Debe poder capturar los tokens internos en las gramáticas que aportan «allowInside=true» en las opciones de definición de gramática");
}

Ejemplo_de_gramaticas_con_apendice: {
  const output1 = TextParserV1.create([
    ["/*@=", "*/", null, {
      allowInside: false,
      includeAppendix: '"template"',
    }]
  ]).parse(`aqui lo que quieras /*@=this can be whatever*/"template" y aqui lo que quieras`);
  parser.assert(output1.tokens[0].outer.endsWith('*/"template"'), "Debe poder incluir el apéndice de graḿatica en el token");
  parser.assert(!output1.tokens[0].inner.includes('"template"'), "Debe retornar un inner que no contemple el apéndice");
}

console.log("[*] Tests passed successfully");

Exportar_a_otras_librerias: {
  try {
    require("fs").copyFileSync(`${__dirname}/text-parser-v1.js`, `${__dirname}/../moduler-v6/src/lib/text-parser-v1.js`);
    console.log("[*] Successfully exported to moduler-v6");
  } catch (error) {
    console.log(error);
  }
}
```

## Opciones de gramática

Los parámetros de cada gramática son:

- `starter:String` - Inicio del match
- `ender:String` - Final del match
- `formatter:Function` - Función que transforma el match en la información que nos interesa
   - Si no se proporciona, se devuelve tal cual lo documenta el parser
- `options:Object` - Objeto con otras opciones. Permite las propiedades:
   - `allowInside:Boolean` - Permite al parser seguir tokenizando el texto aún dentro del contenido de la gramática
      - No todas las gramáticas interesa que permitan esto
      - En casuísticas más avanzadas, este parámetro tendría que ser mucho más complejo
         - Permitiendo que unas gramáticas sí entren en unas y no en otras
         - O en su defecto, multiplicando los parseos, a cada vuelta para unas gramáticas y no otras.
         - Por eso, para simplificar, solo se da la opción de seguir tokenizando dentro, o no
         - Por defecto no dejará
   - `includeAppendix:Array<String>` - Permite agrupar en el match un apéndice o varios en potencia
      - De esta forma, se puede conseguir el efecto que EJS no permite:
      - Permitir comentarios JS que substituirán a una generativa JS
      - El ejemplo es sencillo: `/*@=await render("file.js")*/"template"`
         - El linter dejará de quejarse por el hueco
         - El parser entiende que ese "template" se tiene que ir con el reemplazo del match
         - El código final será JS-compliant, pero, con esto, el código de la plantilla también puede serlo
