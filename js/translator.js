// js/translator.js
class JavaToPythonTranslator {
    constructor() {
        this.pythonCode = '';
        this.indentLevel = 0;
        this.variables = new Set(); // Para tracking de variables declaradas
    }

translate(ast) {
    console.log("Traductor: Iniciando traducción del AST");
    this.pythonCode = '';
    this.indentLevel = 0;
    this.variables.clear();
    
    if (ast && ast.type === 'PROGRAM') {
        this.translateProgram(ast);
    }
    
    console.log("Traductor: Traducción completada. Líneas:", this.pythonCode.split('\n').length);
    return this.pythonCode;
}

    // PROGRAMA ::= 'public' 'class' ID '{' MAIN '}'
    translateProgram(node) {
        this.addLine('# Traducido de Java a Python');
        this.addLine(`# Clase: ${node.className}`);
        this.addLine('');
        
        this.translateMain(node.main);
    }

    // MAIN ::= 'public' 'static' 'void' 'main' '(' 'String' '[' ']' ID ')' '{' SENTENCIAS '}'
    translateMain(node) {
        // En Python no necesitamos el método main, ejecutamos directamente
        this.translateStatements(node.statements);
    }

    // SENTENCIAS
    translateStatements(statements) {
        if (!statements) return;
        
        for (const statement of statements) {
            this.translateStatement(statement);
        }
    }

    translateStatement(statement) {
    if (!statement) return;

    switch (statement.type) {
        case 'DECLARATION':
            this.translateDeclaration(statement);
            break;
        case 'ASSIGNMENT':
            this.translateAssignment(statement);
            break;
        case 'IF':
            this.translateIf(statement);
            break;
        case 'FOR':
            this.translateFor(statement);
            break;
        case 'WHILE':
            this.translateWhile(statement);
            break;
        case 'PRINT':
            this.translatePrint(statement);
            break;
        case 'INCREMENT':
            this.translateIncrement(statement);
            break;
        default:
            console.warn('Tipo de sentencia no reconocido:', statement.type);
    }
}

translateFor(node) {
    // Inicialización
    if (node.initialization) {
        this.addLine(`${node.initialization.variable} = ${this.translateExpression(node.initialization.initialValue)}`);
    }
    
    // Condición
    const condition = this.translateExpression(node.condition);
    this.addLine(`while ${condition}:`);
    
    this.indentLevel++;
    
    // Cuerpo del for
    this.translateStatements(node.statements);
    
    // Actualización
    if (node.update) {
        const updateOp = node.update.operator === '++' ? '+=' : '-=';
        this.addLine(`${node.update.variable} ${updateOp} 1`);
    }
    
    this.indentLevel--;
    this.addLine('');
}


translateIncrement(node) {
    if (node.operator === '++') {
        this.addLine(`${node.variable} += 1`);
    } else if (node.operator === '--') {
        this.addLine(`${node.variable} -= 1`);
    }
}

translateWhile(node) {
    const condition = this.translateExpression(node.condition);
    this.addLine(`while ${condition}:`);
    
    this.indentLevel++;
    this.translateStatements(node.statements);
    this.indentLevel--;
    this.addLine('');
}

translateBinaryOperation(node) {
    const left = this.translateExpression(node.left);
    const right = this.translateExpression(node.right);
    
    // Manejar operaciones booleanas
    if (['==', '!=', '>', '<', '>=', '<='].includes(node.operator)) {
        return `(${left} ${node.operator} ${right})`;
    }
    
    // Manejar operaciones aritméticas
    return `(${left} ${node.operator} ${right})`;
}
    // DECLARACION ::= TIPO LISTA_VARS ';'
    translateDeclaration(node) {
        const pythonType = this.javaToPythonType(node.dataType);
        const defaultValue = this.getDefaultValue(node.dataType);
        
        for (const variable of node.variables) {
            let pythonLine = `${variable.name}`;
            
            if (variable.initialValue) {
                const value = this.translateExpression(variable.initialValue);
                pythonLine += ` = ${value}`;
            } else {
                pythonLine += ` = ${defaultValue}`;
            }
            
            pythonLine += ` # Declaracion: ${node.dataType}`;
            this.addLine(pythonLine);
            
            this.variables.add(variable.name);
        }
    }

    // ASIGNACION ::= ID '=' EXPRESION ';'
    translateAssignment(node) {
        const value = this.translateExpression(node.value);
        this.addLine(`${node.variable} = ${value}`);
    }

    // IF ::= 'if' '(' EXPRESION ')' '{' SENTENCIAS '}' ('else' '{' SENTENCIAS '}')?
    translateIf(node) {
        const condition = this.translateExpression(node.condition);
        this.addLine(`if ${condition}:`);
        
        this.indentLevel++;
        this.translateStatements(node.thenStatements);
        this.indentLevel--;
        
        if (node.elseStatements && node.elseStatements.length > 0) {
            this.addLine('else:');
            this.indentLevel++;
            this.translateStatements(node.elseStatements);
            this.indentLevel--;
        }
    }

    // FOR ::= 'for' '(' FOR_INIT ';' EXPRESION ';' FOR_UPDATE ')' '{' SENTENCIAS '}'
    translateFor(node) {
        // Convertir for a while según la especificación
        const initVar = node.initialization.variable;
        const initValue = this.translateExpression(node.initialization.initialValue);
        const condition = this.translateExpression(node.condition);
        
        // Inicialización
        this.addLine(`${initVar} = ${initValue}`);
        
        // Condición del while
        this.addLine(`while ${condition}:`);
        
        this.indentLevel++;
        
        // Cuerpo del for
        this.translateStatements(node.statements);
        
        // Actualización (i++ → i += 1, i-- → i -= 1)
        const updateOp = node.update.operator === '++' ? '+=' : '-=';
        this.addLine(`${node.update.variable} ${updateOp} 1`);
        
        this.indentLevel--;
        this.addLine(''); // Línea en blanco para separar
    }

    // WHILE ::= 'while' '(' EXPRESION ')' '{' SENTENCIAS '}'
    translateWhile(node) {
        const condition = this.translateExpression(node.condition);
        this.addLine(`while ${condition}:`);
        
        this.indentLevel++;
        this.translateStatements(node.statements);
        this.indentLevel--;
        this.addLine(''); // Línea en blanco para separar
    }

    // PRINT ::= 'System' '.' 'out' '.' 'println' '(' EXPRESION ')' ';'
    translatePrint(node) {
        const expression = this.translateExpression(node.expression);
        
        // Detectar si es string literal o necesita conversión
        if (node.expression.type === 'LITERAL' && 
            (node.expression.dataType === 'String' || node.expression.dataType === 'char')) {
            this.addLine(`print(${expression})`);
        } else {
            this.addLine(`print(str(${expression}))`);
        }
    }

    // EXPRESIONES
    translateExpression(node) {
        if (!node) return '';

        switch (node.type) {
            case 'VARIABLE':
                return node.name;
                
            case 'LITERAL':
                return this.translateLiteral(node);
                
            case 'BINARY_OPERATION':
                return this.translateBinaryOperation(node);
                
            default:
                console.warn('Tipo de expresión no reconocido:', node.type);
                return 'None';
        }
    }

    translateLiteral(node) {
        switch (node.dataType) {
            case 'int':
            case 'double':
                return node.value;
                
            case 'boolean':
                return node.value === 'true' ? 'True' : 'False';
                
            case 'char':
                // 'A' → 'A' (Python usa comillas simples para chars también)
                return node.value;
                
            case 'String':
                return node.value;
                
            default:
                return node.value;
        }
    }

    translateBinaryOperation(node) {
        const left = this.translateExpression(node.left);
        const right = this.translateExpression(node.right);
        
        // Manejar concatenación de strings
        if (node.operator === '+' && 
            (this.isStringType(node.left) || this.isStringType(node.right))) {
            return `str(${left}) + str(${right})`;
        }
        
        return `(${left} ${node.operator} ${right})`;
    }

    // MÉTODOS AUXILIARES
    javaToPythonType(javaType) {
        const typeMap = {
            'int': 'int',
            'double': 'float', 
            'char': 'str',
            'String': 'str',
            'boolean': 'bool'
        };
        return typeMap[javaType] || 'unknown';
    }

    getDefaultValue(javaType) {
        const defaultValueMap = {
            'int': '0',
            'double': '0.0',
            'char': "''",
            'String': '""', 
            'boolean': 'False'
        };
        return defaultValueMap[javaType] || 'None';
    }

    isStringType(node) {
        if (node.type === 'LITERAL') {
            return node.dataType === 'String' || node.dataType === 'char';
        }
        
        // Para variables, asumimos que podrían ser string
        // En una implementación más avanzada, llevaríamos tracking de tipos
        return false;
    }

    addLine(text) {
        const indent = '    '.repeat(this.indentLevel);
        this.pythonCode += indent + text + '\n';
    }
}