// js/parser/DeclarationParser.js
class DeclarationParser extends ParserCore {
    parseDeclaration() {
        console.log(`📝 parseDeclaration() INICIANDO - Token actual: '${this.currentToken.lexeme}'`);
        const startLine = this.currentToken.line;
        const startColumn = this.currentToken.column;

        const typeToken = this.expect('PALABRA_RESERVADA');
        if (!typeToken) {
            console.log("❌ No se pudo obtener el tipo de dato");
            return null;
        }

        console.log(`📝 Tipo de dato: '${typeToken.lexeme}'`);

        const variables = this.parseVariableList();
        if (!variables) {
            console.log("❌ No se pudieron parsear las variables");
            return null;
        }

        console.log(`📝 Variables parseadas: ${variables.length}`);
        console.log(`📝 Después de variables, token actual: '${this.currentToken.lexeme}'`);

        // ✅ CORRECCIÓN: Solo verificar ';' después de procesar todo
        if (this.currentToken.lexeme === ';') {
            this.advance();
            console.log("✅ parseDeclaration() COMPLETADO EXITOSAMENTE");
            return {
                type: 'DECLARATION',
                dataType: typeToken.lexeme,
                variables: variables,
                line: startLine,
                column: startColumn
            };
        } else {
            console.log(`❌ Se esperaba ';' pero se encontró: '${this.currentToken.lexeme}'`);
            this.addError("Se esperaba ';'", this.currentToken.line, this.currentToken.column);
            
            // Si el siguiente token es '}' o EOF, continuar de todos modos
            if (this.currentToken.lexeme === '}' || this.currentToken.type === 'EOF') {
                console.log("✅ Continuando a pesar de ';' faltante");
                return {
                    type: 'DECLARATION',
                    dataType: typeToken.lexeme,
                    variables: variables,
                    line: startLine,
                    column: startColumn
                };
            }
            return null;
        }
    }

    parseVariableList() {
        console.log(`📝 parseVariableList() INICIANDO`);
        const variables = [];

        const firstVar = this.parseVariableDeclaration();
        if (!firstVar) {
            console.log("❌ No se pudo parsear la primera variable");
            return null;
        }

        variables.push(firstVar);
        console.log(`✅ Variable agregada: ${firstVar.name}`);

        while (this.match('SIMBOLO', ',')) {
            console.log(`📝 Encontrada ',' - procesando siguiente variable`);
            const nextVar = this.parseVariableDeclaration();
            if (!nextVar) {
                console.log("❌ No se pudo parsear la siguiente variable");
                return null;
            }
            variables.push(nextVar);
            console.log(`✅ Variable agregada: ${nextVar.name}`);
        }

        console.log(`✅ parseVariableList() COMPLETADO - ${variables.length} variables`);
        return variables;
    }

    parseVariableDeclaration() {
        console.log(`📝 parseVariableDeclaration() - Token actual: '${this.currentToken.lexeme}'`);
        
        const idToken = this.expect('IDENTIFICADOR');
        if (!idToken) {
            console.log("❌ No se pudo obtener identificador");
            return null;
        }

        console.log(`✅ Identificador: '${idToken.lexeme}'`);

        let initialValue = null;
        if (this.match('SIMBOLO', '=')) {
            console.log(`📝 Encontrado '=' - procesando expresión inicial`);
            
            // ✅ CORRECCIÓN: parseExpression será proporcionado por ExpressionParser
            if (typeof this.parseExpression === 'function') {
                initialValue = this.parseExpression();
                if (!initialValue) {
                    console.log("❌ No se pudo parsear la expresión inicial");
                } else {
                    console.log(`✅ Expresión inicial parseada: ${initialValue.type}`);
                }
            } else {
                console.log("❌ parseExpression no disponible - procesando literal simple");
                // Procesamiento simple como fallback
                if (this.currentToken.type === 'ENTERO' || 
                    this.currentToken.type === 'DECIMAL' ||
                    this.currentToken.type === 'CADENA') {
                    
                    initialValue = {
                        type: 'LITERAL',
                        value: this.currentToken.lexeme,
                        dataType: this.currentToken.type === 'ENTERO' ? 'int' : 
                                  this.currentToken.type === 'DECIMAL' ? 'double' : 'String'
                    };
                    this.advance();
                    console.log(`✅ Literal simple procesado: '${initialValue.value}'`);
                }
            }
        }

        return {
            name: idToken.lexeme,
            initialValue: initialValue
        };
    }
}