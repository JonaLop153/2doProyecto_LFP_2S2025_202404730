// js/parser/StatementParser.js - VERSIÓN COMPLETA
class StatementParser extends ExpressionParser {
    parseStatements() {
        const statements = [];
        console.log(`🔍 parseStatements() INICIANDO - Token actual: '${this.currentToken.lexeme}'`);

        let safetyCounter = 0;
        const MAX_SAFETY = 200;

        while (this.currentToken.type !== 'EOF' && 
               this.currentToken.lexeme !== '}' && 
               safetyCounter < MAX_SAFETY) {
            
            safetyCounter++;
            console.log(`🔍 parseStatements: Procesando '${this.currentToken.lexeme}' (iteración ${safetyCounter})`);
            
            const startPosition = this.position;
            const statement = this.parseStatement();
            
            if (statement) {
                statements.push(statement);
                console.log(`✅ Statement agregado: ${statement.type}`);
            } else {
                console.log(`💡 Statement nulo, token actual: '${this.currentToken.lexeme}'`);
                
                if (this.currentToken.lexeme === '}' || this.currentToken.type === 'EOF') {
                    console.log(`🔍 Fin de bloque detectado: '${this.currentToken.lexeme}'`);
                    break;
                }
                
                // Prevenir loop infinito
                if (this.position === startPosition) {
                    console.log("⚠️  No se avanzó, forzando avance...");
                    this.advance();
                }
                
                this.synchronize();
            }
        }

        if (safetyCounter >= MAX_SAFETY) {
            console.log("❌ Límite de seguridad alcanzado en parseStatements");
            this.addError("Límite de seguridad alcanzado - posible loop infinito", 1, 1);
        }

        console.log(`🎉 parseStatements() COMPLETADO. ${statements.length} statements`);
        return statements;
    }
     parseStatement() {
        if (this.currentToken.lexeme === '}' || this.currentToken.type === 'EOF') {
            console.log(`🔍 parseStatement: Fin de bloque '${this.currentToken.lexeme}'`);
            return null;
        }

        const token = this.currentToken;
        console.log(`🔍 parseStatement() - Procesando: '${token.lexeme}'`);

        if (token.lexeme === ';') {
            console.log("💡 Encontrado punto y coma vacío");
            this.advance();
            return { type: 'EMPTY_STATEMENT' };
        }

        switch (token.lexeme) {
            case 'int':
            case 'double':
            case 'char':
            case 'String':
            case 'boolean':
                console.log("📝 Procesando declaración...");
                return this.parseDeclaration();
            case 'if':
                console.log("🔀 Procesando if...");
                return this.parseIf();
            case 'for':
                console.log("🔄 Procesando for...");
                return this.parseFor();
            case 'while':
                console.log("⭕ Procesando while...");
                return this.parseWhile();
            case 'System':
                console.log("🖨️ Procesando print...");
                return this.parsePrint();
            default:
                if (token.type === 'IDENTIFICADOR') {
                    const nextToken = this.peek();
                    console.log(`🔍 Identificador '${token.lexeme}', siguiente: '${nextToken.lexeme}'`);
                    
                    if (nextToken.lexeme === '=') {
                        console.log("📝 Procesando asignación...");
                        return this.parseAssignment();
                    } else if (nextToken.lexeme === '++' || nextToken.lexeme === '--') {
                        console.log("➕ Procesando incremento...");
                        return this.parseIncrement();
                    }
                }
                console.log(`❌ Sentencia no reconocida: '${token.lexeme}'`);
                this.addError(`Sentencia no reconocida: '${token.lexeme}'`, token.line, token.column);
                return null;
        }
    }
parsePrint() {
        const startLine = this.currentToken.line;
        const startColumn = this.currentToken.column;

        console.log("🖨️ parsePrint() INICIANDO");

        if (!this.match('PALABRA_RESERVADA', 'System')) {
            this.addError("Se esperaba 'System'", startLine, startColumn);
            return null;
        }

        if (!this.match('SIMBOLO', '.')) {
            this.addError("Se esperaba '.'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('PALABRA_RESERVADA', 'out')) {
            this.addError("Se esperaba 'out'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('SIMBOLO', '.')) {
            this.addError("Se esperaba '.'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('PALABRA_RESERVADA', 'println')) {
            this.addError("Se esperaba 'println'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('SIMBOLO', '(')) {
            this.addError("Se esperaba '('", this.currentToken.line, this.currentToken.column);
            return null;
        }

        // ✅ AHORA usa parseExpression() de ExpressionParser
        const expression = this.parseExpression();
        if (!expression) {
            console.log("❌ No se pudo parsear la expresión del print");
            return null;
        }

        if (!this.match('SIMBOLO', ')')) {
            this.addError("Se esperaba ')'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('SIMBOLO', ';')) {
            this.addError("Se esperaba ';'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        console.log("✅ parsePrint() COMPLETADO");
        return {
            type: 'PRINT',
            expression: expression,
            line: startLine,
            column: startColumn
        };
    }
    parseIf() {
        const startLine = this.currentToken.line;
        const startColumn = this.currentToken.column;

        console.log("🔀 parseIf() INICIANDO");

        if (!this.match('PALABRA_RESERVADA', 'if')) {
            this.addError("Se esperaba 'if'", startLine, startColumn);
            return null;
        }

        if (!this.match('SIMBOLO', '(')) {
            this.addError("Se esperaba '('", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const condition = this.parseExpression();
        if (!condition) {
            console.log("❌ Condición del if no válida");
            return null;
        }

        if (!this.match('SIMBOLO', ')')) {
            this.addError("Se esperaba ')'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('SIMBOLO', '{')) {
            this.addError("Se esperaba '{'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const thenStatements = this.parseStatements();

        if (!this.match('SIMBOLO', '}')) {
            this.addError("Se esperaba '}'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        let elseStatements = null;
        if (this.match('PALABRA_RESERVADA', 'else')) {
            if (!this.match('SIMBOLO', '{')) {
                this.addError("Se esperaba '{'", this.currentToken.line, this.currentToken.column);
                return null;
            }

            elseStatements = this.parseStatements();

            if (!this.match('SIMBOLO', '}')) {
                this.addError("Se esperaba '}'", this.currentToken.line, this.currentToken.column);
                return null;
            }
        }

        console.log("✅ parseIf() COMPLETADO");
        return {
            type: 'IF',
            condition: condition,
            thenStatements: thenStatements,
            elseStatements: elseStatements,
            line: startLine,
            column: startColumn
        };
    }

    parseFor() {
        const startLine = this.currentToken.line;
        const startColumn = this.currentToken.column;

        console.log("🔄 parseFor() INICIANDO");

        if (!this.match('PALABRA_RESERVADA', 'for')) {
            this.addError("Se esperaba 'for'", startLine, startColumn);
            return null;
        }

        if (!this.match('SIMBOLO', '(')) {
            this.addError("Se esperaba '('", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const init = this.parseForInit();
        if (!init) return null;

        if (!this.match('SIMBOLO', ';')) {
            this.addError("Se esperaba ';'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const condition = this.parseExpression();
        if (!condition) return null;

        if (!this.match('SIMBOLO', ';')) {
            this.addError("Se esperaba ';'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const update = this.parseForUpdate();
        if (!update) return null;

        if (!this.match('SIMBOLO', ')')) {
            this.addError("Se esperaba ')'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('SIMBOLO', '{')) {
            this.addError("Se esperaba '{'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const statements = this.parseStatements();

        if (!this.match('SIMBOLO', '}')) {
            this.addError("Se esperaba '}'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        console.log("✅ parseFor() COMPLETADO");
        return {
            type: 'FOR',
            initialization: init,
            condition: condition,
            update: update,
            statements: statements,
            line: startLine,
            column: startColumn
        };
    }

    parseForInit() {
        console.log("🔄 parseForInit() INICIANDO");

        const typeToken = this.expect('PALABRA_RESERVADA');
        if (!typeToken) return null;

        const idToken = this.expect('IDENTIFICADOR');
        if (!idToken) return null;

        if (!this.match('SIMBOLO', '=')) {
            this.addError("Se esperaba '='", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const expression = this.parseExpression();
        if (!expression) return null;

        console.log("✅ parseForInit() COMPLETADO");
        return {
            type: 'FOR_INIT',
            dataType: typeToken.lexeme,
            variable: idToken.lexeme,
            initialValue: expression
        };
    }

    parseForUpdate() {
        console.log("🔄 parseForUpdate() INICIANDO");

        const idToken = this.expect('IDENTIFICADOR');
        if (!idToken) return null;

        let operator;
        if (this.match('SIMBOLO', '++')) {
            operator = '++';
        } else if (this.match('SIMBOLO', '--')) {
            operator = '--';
        } else {
            this.addError("Se esperaba '++' o '--'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        console.log("✅ parseForUpdate() COMPLETADO");
        return {
            variable: idToken.lexeme,
            operator: operator
        };
    }

    parseWhile() {
        const startLine = this.currentToken.line;
        const startColumn = this.currentToken.column;

        console.log("⭕ parseWhile() INICIANDO");

        if (!this.match('PALABRA_RESERVADA', 'while')) {
            this.addError("Se esperaba 'while'", startLine, startColumn);
            return null;
        }

        if (!this.match('SIMBOLO', '(')) {
            this.addError("Se esperaba '('", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const condition = this.parseExpression();
        if (!condition) return null;

        if (!this.match('SIMBOLO', ')')) {
            this.addError("Se esperaba ')'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('SIMBOLO', '{')) {
            this.addError("Se esperaba '{'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const statements = this.parseStatements();

        if (!this.match('SIMBOLO', '}')) {
            this.addError("Se esperaba '}'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        console.log("✅ parseWhile() COMPLETADO");
        return {
            type: 'WHILE',
            condition: condition,
            statements: statements,
            line: startLine,
            column: startColumn
        };
    }

    parseAssignment() {
        const startLine = this.currentToken.line;
        const startColumn = this.currentToken.column;

        console.log("📝 parseAssignment() INICIANDO");

        const idToken = this.expect('IDENTIFICADOR');
        if (!idToken) return null;

        if (!this.match('SIMBOLO', '=')) {
            this.addError("Se esperaba '='", this.currentToken.line, this.currentToken.column);
            return null;
        }

        const expression = this.parseExpression();
        if (!expression) return null;

        if (!this.match('SIMBOLO', ';')) {
            this.addError("Se esperaba ';'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        console.log("✅ parseAssignment() COMPLETADO");
        return {
            type: 'ASSIGNMENT',
            variable: idToken.lexeme,
            value: expression,
            line: startLine,
            column: startColumn
        };
    }

    parseIncrement() {
        console.log("➕ parseIncrement() INICIANDO");

        const idToken = this.expect('IDENTIFICADOR');
        if (!idToken) return null;

        let operator;
        if (this.match('SIMBOLO', '++')) {
            operator = '++';
        } else if (this.match('SIMBOLO', '--')) {
            operator = '--';
        } else {
            this.addError("Se esperaba '++' o '--'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        if (!this.match('SIMBOLO', ';')) {
            this.addError("Se esperaba ';'", this.currentToken.line, this.currentToken.column);
            return null;
        }

        console.log("✅ parseIncrement() COMPLETADO");
        return {
            type: 'INCREMENT',
            variable: idToken.lexeme,
            operator: operator
        };
    }

    parsePrint() {
    const startLine = this.currentToken.line;
    const startColumn = this.currentToken.column;

    console.log("🖨️ parsePrint() INICIANDO");

    if (!this.match('PALABRA_RESERVADA', 'System')) {
        this.addError("Se esperaba 'System'", startLine, startColumn);
        return null;
    }

    if (!this.match('SIMBOLO', '.')) {
        this.addError("Se esperaba '.'", this.currentToken.line, this.currentToken.column);
        return null;
    }

    if (!this.match('PALABRA_RESERVADA', 'out')) {
        this.addError("Se esperaba 'out'", this.currentToken.line, this.currentToken.column);
        return null;
    }

    if (!this.match('SIMBOLO', '.')) {
        this.addError("Se esperaba '.'", this.currentToken.line, this.currentToken.column);
        return null;
    }

    if (!this.match('PALABRA_RESERVADA', 'println')) {
        this.addError("Se esperaba 'println'", this.currentToken.line, this.currentToken.column);
        return null;
    }

    if (!this.match('SIMBOLO', '(')) {
        this.addError("Se esperaba '('", this.currentToken.line, this.currentToken.column);
        return null;
    }

    // ✅ USAR parseExpression() en lugar de procesamiento manual
    const expression = this.parseExpression();
    if (!expression) {
        console.log("❌ No se pudo parsear la expresión del print");
        return null;
    }

    if (!this.match('SIMBOLO', ')')) {
        this.addError("Se esperaba ')'", this.currentToken.line, this.currentToken.column);
        return null;
    }

    if (!this.match('SIMBOLO', ';')) {
        this.addError("Se esperaba ';'", this.currentToken.line, this.currentToken.column);
        return null;
    }

    console.log("✅ parsePrint() COMPLETADO");
    return {
        type: 'PRINT',
        expression: expression,
        line: startLine,
        column: startColumn
    };
}
}