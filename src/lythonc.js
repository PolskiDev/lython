#!/usr/bin/node
const fs = require('fs')
const process = require('process')

/* lython main.ly3 */
const args = process.argv.slice(2)
let infile
let outfile

if (process.argv.length > 2) {
    infile = args[0]
    outfile = infile.replace(".ly",".py")
}


/* Built-in libraries */
function LythonPreset() {
    let res = ``
    return res;
}
let uses_main = false

/* Indent */
let tabl = ''
function* range(start, end) {
    for (let i = start; i <= end; i++) {
        yield i;
    }
}
function increase_tabline() {
    tabl = tabl+'\t'
}
function decrease_tabline() {
    tabl = tabl.substring(0,-1)
}



/* Fusion Manpage */
function Help() {
    console.log("\n                         LYTHON                 ")
    console.log("------------------------------------------------------------------------")
    console.log("Compile to Python:       lythonc <file>.ly\n")
    console.log("------------------------------------------------------------------------")
    console.log("\nPython's default implementation is CPython, you can also run compiled\ncode in other Python implementations, such as: Jython (JVM), IronPython\n(C# .NET) and GraalVM (JVM).\n")
    console.log("------------------------------------------------------------------------\n\n")
}
/* Compile source-code */
function LythonMain() {
    let regex = /[A-Za-z0-9_$++::.,@#><>=<=>===:=\[\]]+|"[^"]+"|"[^"]+"|\([^)]*\)|\[[^\]]*\]|(:)|(=)/g
    let source = fs.readFileSync(infile,'utf8')
   
    source.split(/\r?\n/).forEach(line =>  {
        let stack = line.match(regex)

        /**
         * @error  stack.lenght
         * @fix    stack?.length
         */
        console.log("Lines:")
        console.log(" ->"+stack+" ")
        for (let i = 0; i < stack?.length; i++) {
            process.stdout.write("Token: ["+stack[i]+"] ~ ")

            if (stack[i] == 'algorithm') {
                fs.writeFileSync(outfile, LythonPreset())
            }
            // End block
            if (stack[i] == 'end') {
                //fs.appendFileSync(outfile,'}\n')
                //increase_tabline()
                decrease_tabline()
            }
            if (stack[i] == 'endalgorithm') {
                fs.appendFileSync(outfile,'main()\n')
            }
            if (stack[i] == 'pass') {
                fs.appendFileSync(outfile,tabl+'pass\n')
            }

            // Comentarios
            if (stack[i] == '#') {
                fs.appendFileSync(outfile,'/*'+stack[i+1].slice(1,-1)+'*/\n')
            }
                

            // Declaração de variaveis e vetores
            if (stack[i] == '=') {
                let vartype = stack[i-2]
                let varname = stack[i-1]
                let value
                let optional_parameter

                /* It has value for variable */
                if (stack[i+1] != 'nil') {
                    value = stack[i+1]
                    /** Oriented Object Programming */
                    if (value.includes('this')) {
                        value = value.replace('this','self')
                    }
                    if (varname.includes('this')) {
                        varname = varname.replace('this','self')
                    }

                    /** Additional arguments */
                    optional_parameter = stack[i+2]
                    if (optional_parameter == undefined) { optional_parameter = ''}

                    //if vartype == 'Integer' or varname == 'Double' or varname == 'String' or varname == 'Boolean':
                    if (vartype.includes('[]')) {
                        vartype = vartype.replace('int[]','')
                        vartype = vartype.replace('float[]','')
                        vartype = vartype.replace('String[]','')
                        vartype = vartype.replace('bool[]','')

                        let res = `${tabl}${varname} = [${value.slice(1,-1)}]\n`
                        fs.appendFileSync(outfile,res)
                    
                    } else if (vartype.includes('{}')) {
                        vartype = vartype.replace('Int{}','')
                        vartype = vartype.replace('Float{}','')
                        vartype = vartype.replace('String{}','')
                        vartype = vartype.replace('Bool{}','')

                        let res = `${tabl}${varname} = [${value.slice(1,-1)}${optional_parameter}]\n`
                        fs.appendFileSync(outfile,res)

                    } else {
                        if (vartype == 'mathematical') {
                            vartype = vartype.replace('mathematical','')
                            let res = `${tabl}${varname} = ${value.slice(1,-1)}${optional_parameter}\n`
                            fs.appendFileSync(outfile,res)
                        } else {
                            let res = `${tabl}${varname} = ${value}${optional_parameter}\n`
                            fs.appendFileSync(outfile,res)
                        }
                    }
                /* It does not have value for variable */
                } else {
                    if (vartype == 'mathematical') {
                        vartype = vartype.replace('mathematical','')
                        let res = `${tabl}${varname} = 0\n`
                        fs.appendFileSync(outfile,res)
                    } else {
                        let res = `${tabl}${varname} = 0\n`
                        fs.appendFileSync(outfile,res)
                    }
                }
            }

            // Reatribuicao de variaveis   
            if (stack[i] == ':=') {
                let varname = stack[i-1]
                let value = stack[i+1]

                if (value.includes('this')) {
                    value = value.replace('this','self')
                }
                if (varname.includes('this')) {
                    varname = varname.replace('this','self')
                }

                let res = `${tabl}${varname} = ${value};\n`
                fs.appendFileSync(outfile,res)
            }


            // Importar modulos
            if(stack[i] == '@include') {
                let libname = stack[i+1]
                fs.appendFileSync(outfile,tabl+`import ${libname}\n`)
            }
            if(stack[i] == '@include_module') {
                let libname = stack[i+1]
                fs.appendFileSync(outfile,tabl+`from ${libname} import *\n`)
            }

            if (stack[i] == 'class') {
                let classname = stack[i+1]
                let inheritance = stack[i+3]
                let res
                if (stack[i+2] == '<') {
                    if (inheritance.slice(0,1) == '(') {
                        res = `${tabl}class ${classname}${inheritance}:\n`
                    } else {
                        res = `${tabl}class ${classname}(${inheritance}):\n`
                    }
                    
                } else {
                    res = `${tabl}class ${classname}:\n`
                }
                

                fs.appendFileSync(outfile, res)
                increase_tabline()
            }
            if (stack[i] == 'function') {
                let funcname = stack[i+1]
                let args = stack[i+2]

                /** Oriented Object Programming */
                if (funcname == 'constructor') {
                    funcname = "__init__"
                }
                if (args.includes('this')) {
                    args = args.replace('this','self')
                }


                /** Standard Functions */
                let res = `${tabl}def ${funcname}${args}:\n`
                if (funcname == 'main') { uses_main = true }
                //else { console.log("\x1b[40mWarning: Script must have main function!") }

                fs.appendFileSync(outfile, res)
                increase_tabline()
            }



            /** Function Return */
            if (stack[i] == 'return') {
                let res = `${tabl}return ${stack[i+1]}\n`
                fs.appendFileSync(outfile,res)
            }

            /* Function call based on parenthesis
            <function> <identifier><params>
            ~= <identifier><params> */
            if(stack[i].slice(0,1) == '('
            && stack[i-1].match(/[A-Za-z0-9]/)
            && stack[i-2] == undefined
            && stack[i+1] != 'do') {
                let funcname = stack[i-1]
                let args = stack[i]

                if (stack.length > 3) {
                    let return_vartype = stack[i+2]
                    let return_varname = stack[i+3]

                    return_vartype = return_vartype.replace('int','')
                    return_vartype = return_vartype.replace('float','')
                    return_vartype = return_vartype.replace('String','')
                    return_vartype = return_vartype.replace('bool','')
                    return_vartype = return_vartype.replace('void','')

                    let res = `${tabl}${return_varname} = ${funcname}${args}\n`
                    fs.appendFileSync(outfile,res)
                } else {
                    let res = `${tabl}${funcname}${args}\n`
                    fs.appendFileSync(outfile,res)
                    //console.log(`E01: Error, unknown function-type delimiter at function call (${funcname})!`)    
                }
            }


            // Condicionais
            if (stack[i] == 'if') {
                let expression = stack[i+1]
                let ContainsDo = stack[i+2]

                // Novos operadores
                expression = expression.replace(" is "," == ")
                expression = expression.replace(" isnot "," != ")
                expression = expression.replace("nil", "None")

                if (ContainsDo == 'do') {
                    let res = `${tabl}if ${expression.slice(1,-1)}:\n`
                    fs.appendFileSync(outfile,res)
                    increase_tabline()
                } else {
                    console.log(`Warning!  [if] requires [do] near ${expression}!`)
                }
                
            }

            if(stack[i] == 'elseif') {
                let expression = stack[i+1]
                let ContainsDo = stack[i+2]

                // Novos operadores
                expression = expression.replace(" is "," == ")
                expression = expression.replace(" isnot "," != ")
                expression = expression.replace("nil", "None")

                if (ContainsDo != undefined) {
                    decrease_tabline()
                    increase_tabline()
                    let res = `${tabl}elif ${expression.slice(1,-1)}:\n`
                    fs.appendFileSync(outfile,res)
                    increase_tabline()
                } else {
                    console.log(`Warning!  [elseif] requires [do] near ${expression}!`)
                }
            }
            if (stack[i] == 'else') {
                decrease_tabline()
                increase_tabline()
                let res = `${tabl}else:\n`
                fs.appendFileSync(outfile,res)
                increase_tabline()
            }
            if (stack[i] == 'while') {
                let expression = stack[i+1]
                let ContainsDo = stack[i+2]

                // Novos operadores
                expression = expression.replace(" is "," == ")
                expression = expression.replace(" isnot "," != ")
                expression = expression.replace("nil", "None")

                if (ContainsDo != undefined) {
                    decrease_tabline()
                    increase_tabline()
                    let res = `${tabl}while ${expression.slice(1,-1)}:\n`
                    fs.appendFileSync(outfile,res)
                    increase_tabline()
                } else {
                    console.log(`Warning!  [while] requires [do] near ${expression}!`)
                }
            }
            if (stack[i] == 'for') {
                let iterator = stack[i+1]
                let Min = stack[i+3].slice(0,stack[i+3].index('.'))
                let Max = stack[i+3].slice(stack[i+3].index('.')+2, stack[i+3].length)

                decrease_tabline()
                increase_tabline()
                let res = `${tabl}for ${iterator} in range(${Min}, ${Max}):\n`
                fs.appendFileSync(outfile,res)
                increase_tabline()
            }
            if (stack[i] == 'times') {
                let times = stack[i-1]
                decrease_tabline()
                increase_tabline()
                let res = `${tabl}for i in range(0,${times}):\n`
                fs.appendFileSync(outfile,res)
                increase_tabline()
            }

            //Interromper ciclos
            if (stack[i] == 'break') {
                let res = `${tabl}break\n`
                fs.appendFileSync(outfile,res)
            }
            if (stack[i] == 'continue') {
                let res = `${tabl}continue\n`
                fs.appendFileSync(outfile,res)
            }

            // New objects
            if(stack[i] == "@new") {
                let obj = stack[i+1]
                let classname = stack[i+3]
                let constructor_params = stack[i+4]
                //increase_tabline()
                let res = `${tabl}${obj} = ${classname}${constructor_params}\n`
                fs.appendFileSync(outfile,res)
            }

            // Exception
            if (stack[i] == 'try') {
                let res = tabl+"try:\n"
                fs.appendFileSync(outfile,res)
                increase_tabline()
            }
            if (stack[i] == 'catch') {
                //let exception_type = stack[i+1]
                let res = tabl+`except:\n`
                fs.appendFileSync(outfile,res)
                increase_tabline()
            }
            if (stack[i] == 'finally') {
                let res = tabl+"finally:\n"
                fs.appendFileSync(outfile,res)
                increase_tabline()
            }
        }
        //console.log(list)
    })
}

if (process.argv.length > 2) {
    LythonMain()
} else {
    Help()
}