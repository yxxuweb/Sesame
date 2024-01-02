/**
 * 参考扩展巴科斯范式(EBNF)
 *
 * = 定义
 * , 连接符
 * ; 结束符
 * | 或
 * [] 可选
 * {} 重复
 * "" 终端字符串
 *
 * ----> 核心结构
 * formula = mid_expr , { and_or_sign , mid_expr }
 * mid_expr = combine_expr | "(" , combine_expr , ")"
 * combinexpr = range_expr2 | range_expr1
 * range_e_expr = range_expr , { and_or_sign , range_expr }
 * range_expr2 = dynamic_sign , gl_sign , numerical
 * range_expr1 = numerical , gl_sign , dynamic_sign , [ gl_sign , numerical ]
 *
 * ----> 变量定义, expr的详细结构见calc_math.js头部注释
 * numerical = expr | number
 * number = int | float | percent
 * percent = int | float , . , fraction , "%"
 * int = digit_no_zero , { digit }
 * fraction = digit , { digit }
 * float = digit , { digit } , [ "." , digit , { digit } ]
 * gl_sign = "<" | "≤" | ">" | "≥"
 * digit = digit_zero | digit_no_zero
 * digit_no_zero = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
 * digit_zero = "0"
 * dynamic_sign = [ "x" ~ "z" ]
 * and_or_sign = "&" | "|"
 */

import {
  TokenType,
  ParseError,
  ParseErrorType,
  ParseAstErrorMessage,
  Token,
  TokenPriority,
  Node,
  tokenize,
  And_Or_Config,
  createFormulaFromTokens,
  getFactorNameById
} from './lexter.js'
import { CalcController } from './lexter_parse.js'

/**
 * @class
 * @classdesc 不等式解析核心控制类
 */
export class FormulaController {
  /**
   * @description 目标公式字符串
   * @type {string}
   */
  formula = ''

  /**
   * @description 解析之后的tokens集合
   * @type {Token[]}
   */
  tokens = []

  /**
   * @description 用于展示的tokens集合
   * @type {Token[]}
   */
  display_tokens = []

  /**
   * @description 基于formula生成的ast节点树
   * @type {Node}
   */
  ast = null

  /**
   * @description 临时存储ast节点容器
   * @type {Node[]}
   */
  node_stack = []

  /**
   * @description 错误信息
   * @type {ParseError}
   */
  error_info = null

  /**
   * @description 解析AST使用的index
   * @type {number}
   */
  index_for_parse = 0

  /**
   * @description 因子列表
   * @type {Factor[]}
   */
  factorList = []

  /**
   * @description 不等号和关系符集合
   * @type {[TokenType|string,TokenType|string]}
   */
  gl_ao_sign = [TokenType.GL_Sign, TokenType.And_Sign, TokenType.Or_Sign]

  /**
   * @constructor
   * @param {string} formula
   * @param {string[]} factorList
   */
  constructor({ formula = '', factorList = [] }) {
    this.formula = formula
    this.factorList = factorList
    try {
      console.time('Tokenize formula time')
      this.tokens = tokenize(this.formula, this.factorList)
      console.timeEnd('Tokenize formula time')
      console.time('Parse formula ast time')

      debugger
      this.ast = this.parser()
      console.timeEnd('Parse formula ast time')
      this.rebuildTokensForDisplay()
    } catch (error) {
      this.error_info = error
    }
  }


  /**
   * @function
   * @description 起始括号的处理
   * @param {Node} node
   */
  do_start_brackets(node) {
    this.node_stack.push(node)
    this.index_for_parse++
    this.parser_match.call(this)
  }

  /**
   * @function
   * @description 获取四则运算的ast树
   * @param {Token[]} tokens
   * @return CalcController
   */
  getNumericExprNode(tokens = []) {
    const calc = new CalcController({ tokens, factorObjList: this.factorList })

    if (calc.error_info) {
      throw calc.error_info
    }

    return calc
  }

  /**
   * @function
   * @description 解析四则运算公式还是纯数字,并构建Node
   * @return Node
   */
  analyzeExprOrNumeric() {
    /**
     * @type {Token[]}
     */
    const tokens = []

    let s_bracket_num = 0
    let expr_start_pos, expr_end_pos
    let first = true

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // EOF
      if (this.index_for_parse > this.tokens.length - 1) {
        break
      }
      const token = this.tokens[this.index_for_parse]
      if (first) {
        first = false
        expr_start_pos = token.start_pos
        expr_end_pos = token.end_pos
      }
      if (token.type === TokenType.Start_Brackets) {
        s_bracket_num++
        tokens.push(token)
        this.index_for_parse++
        continue
      }

      if (token.type === TokenType.End_Brackets) {
        if (s_bracket_num > 0) {
          s_bracket_num--
          tokens.push(token)
        } else {
          const stack_top_node = this.node_stack.pop()

          if (stack_top_node === null) {
            throw new ParseError({
              type: ParseErrorType.ParseAstError,
              message: new ParseAstErrorMessage({
                start_pos: token.start_pos,
                end_pos: token.end_pos,
                value: token.value,
                addition_message: '无匹配括号!'
              }).message
            })
          }

          if (stack_top_node.token.type === TokenType.Start_Brackets) {
            tokens.unshift(stack_top_node.token)
            tokens.push(token)
          } else {
            this.node_stack.push(stack_top_node)
            this.index_for_parse--
            break
          }
        }
        this.index_for_parse++
        continue
      }

      if (
        [TokenType.GL_Sign, TokenType.And_Sign, TokenType.Or_Sign].includes(
          token.type
        )
      ) {
        this.index_for_parse--
        break
      }

      if (
        [
          TokenType.Add_Sub,
          TokenType.Multi_Div,
          TokenType.Numeric,
          TokenType.Factor_Sign
        ].includes(token.type)
      ) {
        tokens.push(token)
        this.index_for_parse++
        continue
      }

      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: token.start_pos,
          end_pos: token.end_pos,
          value: token.value,
          addition_message: '存在非法字符!'
        }).message
      })
    }

    if (
      tokens.length === 1 &&
      [TokenType.Factor_Sign, TokenType.Numeric].includes(tokens[0].type)
    ) {
      return new Node({
        token: tokens[0]
      })
    }

    const calc = this.getNumericExprNode(tokens)
    const expr_node = calc.ast
    expr_node.complete = true
    if (calc.contain_factor) {
      return new Node({
        token: new Token({
          type: TokenType.Factor_Expr,
          node: expr_node,
          start_pos: expr_start_pos,
          end_pos: expr_end_pos,
          priority: TokenPriority[TokenType.Factor_Expr]
        }),
        complete: true
      })
    } else {
      return new Node({
        token: new Token({
          type: TokenType.Calc_Expr,
          node: expr_node,
          start_pos: expr_start_pos,
          end_pos: expr_end_pos,
          value: calc.result,
          priority: TokenPriority[TokenType.Calc_Expr]
        }),
        complete: true
      })
    }
  }

  /**
   * @function
   * @description 添加数字|算式节点
   * @param {Node} node
   */
  add_numeric_node(node) {
    const stack_top_node = this.node_stack[this.node_stack.length - 1]
    const token = node.token
    if (!stack_top_node) {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: token.start_pos,
          end_pos: token.end_pos,
          value: token.value,
          addition_message: '纯数字或四则运算不是合法不等式!'
        }).message
      })
    }

    let recursive_node = stack_top_node

    while (recursive_node.right) {
      recursive_node = recursive_node.right
    }

    if (
      recursive_node.token.type !== TokenType.GL_Sign ||
      recursive_node.right
    ) {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: token.start_pos,
          end_pos: token.end_pos,
          value: token.value,
          addition_message: '前置位置没有合法操作字符!'
        }).message
      })
    }

    recursive_node.right = new Node({ token })
  }

  /**
   * @function
   * @description 下个Token是结束括号的操作
   * @param {Node} node
   * @param {Token} end_bracket_token
   */
  do_end_bracket(node, end_bracket_token) {
    const current_token = node.token
    if (this.node_stack.length === 0) {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: end_bracket_token.start_pos,
          end_pos: end_bracket_token.end_pos,
          value: end_bracket_token.value,
          addition_message: '非法括号!'
        }).message
      })
    }
    const stack_top_node = this.node_stack[this.node_stack.length - 1]

    if (!this.gl_ao_sign.includes(stack_top_node.token.type)) {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: end_bracket_token.start_pos,
          end_pos: end_bracket_token.end_pos,
          value: end_bracket_token.value,
          addition_message: '无效括号!'
        }).message
      })
    }

    if (
      [TokenType.Numeric, TokenType.Calc_Expr, TokenType.Factor_Sign].includes(
        current_token.type
      )
    ) {
      this.add_numeric_node(
        new Node({
          token: current_token
        })
      )
    } else if (this.gl_ao_sign.includes(current_token.type)) {
      this.do_gl_and_ao.call(this, node, end_bracket_token)
    } else {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: end_bracket_token.start_pos,
          end_pos: end_bracket_token.end_pos,
          value: end_bracket_token.value,
          addition_message: '括号内存在非法字符!'
        }).message
      })
    }

    const stack_pop_node = this.node_stack.pop()
    stack_pop_node.complete = true
    const maybe_start_bracket_node = this.node_stack.pop()

    if (!maybe_start_bracket_node) {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: end_bracket_token.start_pos,
          end_pos: end_bracket_token.end_pos,
          value: end_bracket_token.value,
          addition_message: '非法闭合括号!'
        }).message
      })
    }

    if (maybe_start_bracket_node.token.type !== TokenType.Start_Brackets) {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: end_bracket_token.start_pos,
          end_pos: end_bracket_token.end_pos,
          value: end_bracket_token.value,
          addition_message: '无匹配括号!'
        }).message
      })
    }

    const after_bracket_token = this.tokens[++this.index_for_parse]
    if (after_bracket_token) {
      if (this.gl_ao_sign.includes(after_bracket_token.type)) {
        this.do_gl_and_ao.call(this, stack_pop_node, after_bracket_token)
      } else if (after_bracket_token.type === TokenType.End_Brackets) {
        this.do_end_bracket.call(this, stack_pop_node, after_bracket_token)
      } else {
        throw new ParseError({
          type: ParseErrorType.ParseAstError,
          message: new ParseAstErrorMessage({
            start_pos: after_bracket_token.start_pos,
            end_pos: after_bracket_token.end_pos,
            value: after_bracket_token.value,
            addition_message: '非法字符!'
          }).message
        })
      }
      // EOF
    } else {
      const prev_stack_top_node = this.node_stack.pop()
      if (!prev_stack_top_node) {
        this.node_stack.push(node)
        return
      }

      const new_stack_top_node = this.recursive_add_node(
        stack_pop_node,
        prev_stack_top_node
      )
      this.node_stack.push(new_stack_top_node)
    }
  }

  /**
   * @function
   * @description 添加 --> 关系节点 || 不等式节点
   * @param {Node} node
   * @param {Node} target_node
   */
  recursive_add_node(node, target_node) {
    let recursive_node = target_node
    const upper_priority = target_node.token.priority
    const n_priority = node.token.priority
    let cache_upper_node = null
    const cache_left_node = node.left
    let back_node = null
    const isAllAndOrSign =
      upper_priority === TokenPriority[TokenType.And_Sign] &&
      n_priority === TokenPriority[TokenType.And_Sign]

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (recursive_node.token.priority < n_priority || node.complete) {
        if (!recursive_node.right) {
          recursive_node.right = node
          back_node = target_node
          break
        } else {
          cache_upper_node = recursive_node
          recursive_node = recursive_node.right
        }
      } else {
        if (!recursive_node.right) {
          recursive_node.right = cache_left_node
          if (isAllAndOrSign) {
            node.left = target_node
            back_node = node
          } else {
            node.left = recursive_node
            if (cache_upper_node) {
              cache_upper_node.right = node
              back_node = target_node
            } else {
              back_node = node
            }
          }
          break
        } else {
          cache_upper_node = recursive_node
          recursive_node = recursive_node.right
        }
      }
    }

    return back_node
  }

  /**
   * @function
   * @description 下一个Token是关系运算符||不等号的操作
   * @param {Node} node
   * @param {Token} next_token
   */
  do_gl_and_ao(node, next_token) {
    const current_token = node.token
    const ao_node =
      next_token.type === TokenType.End_Brackets
        ? node
        : new Node({
          token: next_token,
          left: node
        })
    if (this.node_stack.length === 0) this.node_stack.push(ao_node)
    else {
      const stack_top_node = this.node_stack[this.node_stack.length - 1]
      if (stack_top_node.token.type === TokenType.Start_Brackets) {
        this.node_stack.push(ao_node)
      } else if (this.gl_ao_sign.includes(stack_top_node.token.type)) {
        const target_node = this.node_stack.pop()
        const new_stack_top_node = this.recursive_add_node(ao_node, target_node)
        this.node_stack.push(new_stack_top_node)
      } else {
        throw new ParseError({
          type: ParseErrorType.ParseAstError,
          message: new ParseAstErrorMessage({
            start_pos: current_token.start_pos,
            end_pos: current_token.end_pos,
            value: current_token.value
          }).message
        })
      }
    }
    this.index_for_parse++
    this.parser_match.call(this)
  }

  /**
   * @function
   * @description 模式中以数字打头
   * @param {Token} token
   */
  doNumeric(token) {
    const numeric_or_factor_node = this.analyzeExprOrNumeric()
    const next_token = this.tokens[++this.index_for_parse]

    if (!next_token) {
      this.add_numeric_node(numeric_or_factor_node)
    } else if (next_token.type === TokenType.End_Brackets) {
      this.do_end_bracket(numeric_or_factor_node, next_token)
    } else if (this.gl_ao_sign.includes(next_token.type)) {
      this.do_gl_and_ao(numeric_or_factor_node, next_token)
    } else {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: token.start_pos,
          end_pos: token.end_pos,
          value: token.value,
          addition_message: '非法字符!'
        }).message
      })
    }
  }

  /**
   * @function
   * @description 将Tokens解析成ast树
   * @return Node
   */
  parser() {
    if (this.tokens.length === 0) {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          message: '待解析的Tokens列表不能为空!'
        }).message
      })
    }
    // 重置启动index,避免干扰
    this.index_for_parse = 0
    // 构建node_stack
    this.parser_match()
    this.ast = this.node_stack[0]
    return this.ast
  }

  /**
   * @function
   * @description 解析模式集合
   */
  parser_match() {
    if (this.index_for_parse > this.tokens.length - 1) return
    const current_token = this.tokens[this.index_for_parse]

    switch (current_token.type) {
      case TokenType.Start_Brackets:
        this.do_start_brackets(
          new Node({
            token: current_token
          })
        )
        break
      case TokenType.Numeric:
        this.doNumeric(current_token)
        break
      case TokenType.Factor_Sign:
        this.doNumeric(current_token)
        break
      default:
        throw new ParseError({
          type: ParseErrorType.ParseAstError,
          message: new ParseAstErrorMessage({
            start_pos: current_token.start_pos,
            end_pos: current_token.end_pos,
            value: current_token.value,
            addition_message: '存在非法字符!'
          }).message
        })
    }

    const index = this.node_stack.findIndex(
      (s) => s.token.type === TokenType.Start_Brackets
    )
    if (index >= 0) {
      const error_node = this.node_stack[index]
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: error_node.token.start_pos,
          end_pos: error_node.token.end_pos,
          value: error_node.token.value,
          addition_message: '缺少匹配的括号!'
        }).message
      })
    }

    this.check_special_error()
  }

  /**
   * @function
   * @description 校验特殊场景异常,包括语法合法但业务场景不合法的场景
   * TODO 符合语法但是不符合业务场景的错误尚未处理
   */
  check_special_error() {
    let recursive_node = this.node_stack[0]
    while (recursive_node.right) {
      recursive_node = recursive_node.right
    }

    if (
      ![
        TokenType.Numeric,
        TokenType.Factor_Sign,
        TokenType.Calc_Expr,
        TokenType.Factor_Expr
      ].includes(recursive_node.token.type)
    ) {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: recursive_node.token.start_pos,
          end_pos: recursive_node.token.end_pos,
          value: recursive_node.token.value,
          addition_message: '操作符右侧缺少结束数字节点!'
        }).message
      })
    }
  }

  /**
   * @function
   * @description 根据factor id获取名称
   * @param {string} id
   * @return {string}
   */
  getFactorNameById(id = '') {
    return getFactorNameById(id, this.factorList)
  }

  /**
   * @function
   * @description 根据与或符合id获取名称
   * @param {string} id
   * @return {string}
   */
  getAndOrNameById(id = '') {
    const index = And_Or_Config.findIndex((config) => config.id === id)
    if (index >= 0) {
      return And_Or_Config[index].name
    }
    return ''
  }

  /**
   * @function
   * @description 获取后端需要的公式
   * @return {string}
   */
  getBackendFormula() {
    createFormulaFromTokens(this.tokens, this.factorList)
  }

  rebuildTokensForDisplay() {
    if (!this.ast) return []
    this.inOrderWalk(this.ast)
  }

  inOrderWalk(node) {
    if (!node) return
    if (node.token.type === TokenType.Factor_Expr) {
      node = node.token.node
    }
    if (node.left) this.inOrderWalk(node.left)
    this.display_tokens.push(node.token)
    if (node.right) this.inOrderWalk(node.right)
  }
}
