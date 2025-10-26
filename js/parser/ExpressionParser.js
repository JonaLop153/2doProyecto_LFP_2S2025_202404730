// js/parser/ExpressionParser.js
class ExpressionParser extends DeclarationParser {
    parseExpression() {
        console.log(`🔍 parseExpression() - Token actual: '${this.currentToken.lexeme}'`);
        
        // Expresión simple: solo un literal o variable
        if (this.currentToken.type === 'IDENTIFICADOR') {
            const expression = {
                type: 'VARIABLE',
                name: this.currentToken.lexeme
            };
            this.advance();
            console.log(`✅ Expresión variable: '${expression.name}'`);
            return expression;
        }
        else if (this.currentToken.type === 'ENTERO' || 
                 this.currentToken.type === 'DECIMAL' ||
                 this.currentToken.type === 'CADENA') {
            
            const dataType = this.currentToken.type === 'ENTERO' ? 'int' : 
                           this.currentToken.type === 'DECIMAL' ? 'double' : 'String';
            
            const expression = {
                type: 'LITERAL',
                value: this.currentToken.lexeme,
                dataType: dataType
            };
            this.advance();
            console.log(`✅ Expresión literal: '${expression.value}' (${dataType})`);
            return expression;
        }
        
        console.log(`❌ No se pudo parsear expresión: '${this.currentToken.lexeme}'`);
        return null;
    }

    parseTerm() {
        let left = this.parseFactor();
        if (!left) return null;

        while (true) {
            const operator = this.match('SIMBOLO');
            if (!operator || (operator.lexeme !== '+' && operator.lexeme !== '-')) {
                break;
            }

            const right = this.parseFactor();
            if (!right) return null;

            left = {
                type: 'BINARY_OPERATION',
                operator: operator.lexeme,
                left: left,
                right: right,
                line: operator.line,
                column: operator.column
            };
        }

        return left;
    }

    parseFactor() {
        let left = this.parsePrimary();
        if (!left) return null;

        while (true) {
            const operator = this.match('SIMBOLO');
            if (!operator || (operator.lexeme !== '*' && operator.lexeme !== '/')) {
                break;
            }

            const right = this.parsePrimary();
            if (!right) return null;

            left = {
                type: 'BINARY_OPERATION',
                operator: operator.lexeme,
                left: left,
                right: right,
                line: operator.line,
                column: operator.column
            };
        }

        return left;
    }

    parsePrimary() {
        const token = this.currentToken;
        console.log(`🔍 parsePrimary(): '${token.lexeme}'`);

        if (token.type === 'IDENTIFICADOR') {
            this.advance();
            return {
                type: 'VARIABLE',
                name: token.lexeme,
                line: token.line,
                column: token.column
            };
        }

        if (token.type === 'ENTERO' || token.type === 'DECIMAL' || 
            token.type === 'CADENA' || token.type === 'CARACTER' ||
            token.lexeme === 'true' || token.lexeme === 'false') {
            
            let dataType;
            if (token.type === 'ENTERO') dataType = 'int';
            else if (token.type === 'DECIMAL') dataType = 'double';
            else if (token.type === 'CADENA') dataType = 'String';
            else if (token.type === 'CARACTER') dataType = 'char';
            else if (token.lexeme === 'true' || token.lexeme === 'false') dataType = 'boolean';
            
            this.advance();
            return {
                type: 'LITERAL',
                value: token.lexeme,
                dataType: dataType,
                line: token.line,
                column: token.column
            };
        }

        if (token.lexeme === '(') {
            this.advance();
            const expression = this.parseExpression();
            if (!expression) return null;

            if (!this.match('SIMBOLO', ')')) {
                this.addError("Se esperaba ')'", this.currentToken.line, this.currentToken.column);
                return null;
            }

            return expression;
        }

        this.addError(`Expresión primaria no reconocida: '${token.lexeme}'`, 
                     token.line, token.column);
        return null;
    }

    isComparisonOperator(op) {
        return ['==', '!=', '>', '<', '>=', '<='].includes(op);
    }
}