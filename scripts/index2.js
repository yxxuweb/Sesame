export const Sub_Op = '-'
export const Divide_Op = '÷'
export const Multi_op = '×'
export const Start_Bracket = '('
export const End_Bracket = ')'
export const Start_Curly_Bracket = '{'
export const End_Curly_Bracket = '}'
export const And_Sign = '&'
export const And_CN_Sign = '且'
export const Or_Sign = '|'
export const Or_CN_Sign = '或'
export const And_Locale = {
  'zh-CN': '且',
  'en-US': 'And'
}
export const Or_Locale = {
  'zh-CN': '或',
  'en-US': 'Or'
}
export const And_Or_Config = [
  {
    id: And_Sign,
    name: And_CN_Sign
  },
  {
    id: Or_Sign,
    name: Or_CN_Sign
  }
]
export const Greater_Sign = '>'
export const Greater_Equal_Sign = '≥'
export const Less_Sign = '<'
export const Less_Equal_Sign = '≤'
export const Numeric_Dot = '.'
export const Numeric_percent = '%'
export const Exclude_Zero_Nums = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
export const Zero_Num = '0'
export const All_Nums = [Zero_Num, ...Exclude_Zero_Nums]

export const config = {
  add_sub_op: [Add_Op, Sub_Op],
  multi_div_op: [Multi_op, Divide_Op],
  calc_op_collector: [Add_Op, Sub_Op, Multi_op, Divide_Op],
  bracket: [Start_Bracket, End_Bracket],
  and_or_sign: [And_Sign, Or_Sign],
  and_or_cn_sign: [Or_CN_Sign, And_CN_Sign],
  and_local_sign: [...Object.values(And_Locale)],
  or_locale_sign: [...Object.values(Or_Locale)],
  greater_less_sign: [
    Less_Sign,
    Greater_Sign,
    Less_Equal_Sign,
    Greater_Equal_Sign
  ],
  special_numeric_char: [Numeric_Dot, Numeric_percent]
}

export const replace_reg = /\s/g

/**
 * @readonly
 * @enum {string}
 * @type {{Numeric: string, Start_Brackets: string, End_Brackets: string, Add_Sub: string, Multi_Div: string}}
 */
export const TokenType = {
  Numeric: 'numeric',
  Add_Sub: 'add_or_sub_op',
  Multi_Div: 'multi_or_div_op',
  Start_Brackets: 'start_bracket',
  End_Brackets: 'end_bracket',
  Calc_Expr: 'calc_expr',
  Factor_Expr: 'factor_expr',
  GL_Sign: 'greater_less_sign',
  Factor_Sign: 'factor_sign',
  // And_Or_Sign: 'and_or_sign',
  And_Sign: 'and_sign',
  Or_Sign: 'or_sign'
}

/**
 * @readonly
 * @description 不同Token类型对应的优先级 数字越大优先级越高
 * @enum {number}
 * @type {{[p: string]: number}}
 */
export const TokenPriority = {
  [TokenType.Start_Brackets]: 6,
  [TokenType.End_Brackets]: 6,
  [TokenType.Multi_Div]: 5,
  [TokenType.Add_Sub]: 4,
  [TokenType.GL_Sign]: 3,
  [TokenType.And_Sign]: 2,
  [TokenType.Or_Sign]: 2,
  [TokenType.Numeric]: 1,
  [TokenType.Calc_Expr]: 1,
  [TokenType.Factor_Expr]: 1,
  [TokenType.Factor_Sign]: 1
}

/**
 * @class
 * @classdesc Token类
 */
export class Token {
  /**
   * @description token类型
   * @type {string}
   */
  type
  /**
   * @description 对应的字符串值,如果是四则运算,存储四则运算结果
   * @type {string}
   */
  value = ''
  /**
   * @description 起始位置
   * @type {number}
   */
  start_pos = 0
  /**
   * @description 结束位置 (包含空白符)
   * @type {number}
   */
  end_pos = 0

  /**
   * @description token的优先级
   * @type {number}
   */
  priority

  /**
   * @description 存储扩展数据
   * @type {object}
   */
  data = {}

  /**
   * @description 特殊token, 存储Node信息
   * @type {Node}
   */
  node

  /**
   * @constructor
   * @param {string} type;
   * @param {string} value
   * @param {number} start_pos
   * @param {number} end_pos
   * @param {number} priority
   * @param {object} data
   * @param {Node} node
   */
  constructor({
    type,
    value,
    start_pos,
    end_pos,
    priority = TokenPriority[TokenType.Numeric],
    data = {},
    node
  }) {
    this.type = type
    this.value = value
    this.start_pos = start_pos
    this.end_pos = end_pos
    this.priority = priority
    this.data = data
    this.node = node
  }
}

/**
 * @class
 * @classdesc ast节点类
 */
export class Node {
  /**
   * @description 节点是否已闭合,针对括号,一对括号内的内容处理完了才是true
   * @type {boolean}
   */
  complete
  /**
   * @description 节点对应token
   * @type {Token}
   */
  token = null
  /**
   * @description 左子节点
   * @type {Node}
   */
  left = null
  /**
   * @description 右子节点
   * @type {Node}
   */
  right = null

  /**
   * @constructor
   * @param {Token} token
   * @param {Node} left
   * @param {Node} right
   * @param {boolean} complete
   */
  constructor({ token, left = null, right = null, complete = false }) {
    this.token = token
    this.left = left
    this.right = right
    this.complete = complete
  }
}

/**
 * @readonly
 * @enum {string}
 * @type {{TokenizeError: string, ParseAstError: string}}
 */
export const ParseErrorType = {
  TokenizeError: 'Tokenize Error',
  ParseAstError: 'Parse AST Error',
  CheckRangeError: 'Check Range Error'
}

/**
 * @class
 * @classdesc 解析tokenize错误消息
 */
export class TokenizeErrorMessage {
  start_pos = 0
  end_pos = 0
  char = ''

  message = ''

  /**
   * @constructor
   * @param {number} start_pos
   * @param {number} end_pos
   * @param {string} char
   * @param {string} message
   */
  constructor({ start_pos = 0, end_pos = 0, char = '', message = '' }) {
    this.start_pos = start_pos
    this.end_pos = end_pos
    this.char = char
    const error_prefix = '将字符串公式解析成Token列表异常:'
    this.message = `${error_prefix} 异常字符 -> ${char}, 异常起始位置 -> ${start_pos}, 异常结束位置 -> ${end_pos} ${message ? `, ${message}` : ''
      }`
  }
}

/**
 * @class
 * @classdesc 解析ast错误消息
 */
export class ParseAstErrorMessage {
  start_pos = 0
  end_pos = 0
  value = ''

  message = ''

  /**
   * @constructor
   * @param {number} start_pos
   * @param {number} end_pos
   * @param {string} value
   * @param {string} message
   * @param {string} addition_message
   */
  constructor({
    start_pos = 0,
    end_pos = 0,
    value = '',
    message = '',
    addition_message = ''
  }) {
    this.start_pos = start_pos
    this.end_pos = end_pos
    this.value = value
    const error_prefix = '解析AST异常:'
    this.message = message
      ? `${error_prefix} ${message}`
      : `${error_prefix} 异常字符 -> ${value}, 异常起始位置 -> ${start_pos}, 异常结束位置 -> ${end_pos} ${addition_message ? `; ${addition_message}` : ''
      }`
  }
}

/**
 * @class
 * @classdesc 解析错误对象
 */
export class ParseError extends Error {
  /**
   * @description 错误类型
   * @type {string}
   */
  type = ''

  /**
   * @constructor
   * @param {string} type
   * @param {string} message
   */
  constructor({ type, message = '' }) {
    super(message)
    this.type = type
  }
}

/**
 * @function
 * @description 获取字符对应的TokenType
 * @param {string} char
 * @param {number} start_pos
 * @param {number} end_pos
 * @return string
 */
export function getTokenType(char, start_pos, end_pos) {
  if (config.multi_div_op.includes(char)) {
    return TokenType.Multi_Div
  } else if (config.add_sub_op.includes(char)) {
    return TokenType.Add_Sub
  } else if (Start_Bracket === char) {
    return TokenType.Start_Brackets
  } else if (End_Bracket === char) {
    return TokenType.End_Brackets
  } else if (config.greater_less_sign.includes(char)) {
    return TokenType.GL_Sign
  } else if (config.and_local_sign.includes(char)) {
    return TokenType.And_Sign
  } else if (config.or_locale_sign.includes(char)) {
    return TokenType.Or_Sign
  } else {
    throw new ParseError({
      type: ParseErrorType.TokenizeError,
      message: new TokenizeErrorMessage({ start_pos, end_pos, char }).message
    })
  }
}

/**
 * @function
 * @description 根据token类型进行计算
 * @param {Token} token
 * @param {number} left_val
 * @param {number} right_val
 */
export function match_calc_func(token, left_val, right_val) {
  switch (token.value) {
    case Add_Op:
      return left_val + right_val
    case Sub_Op:
      return left_val - right_val
    case Multi_op:
      return left_val * right_val
    case Divide_Op:
      return left_val / right_val
    default:
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: token.start_pos,
          end_pos: token.end_pos,
          value: token.value,
          addition_message: `计算出错: 左侧值 = ${left_val}, 右侧值 = ${right_val}, 操作符 = ${token.value}`
        })
      })
  }
}

/**
 * @function
 * @description 去除所有空白字符
 * @param str
 * @return {string}
 */
export function trim(str = '') {
  return str.replace(replace_reg, '')
}

/**
 * @function
 * @description 校验是否合法因子,如果合法返回相应Token对象
 * @param {string} factor
 * @param {number} start_pos
 * @param {number} end_pos
 * @param {Factor[]} factorList
 * @return Token
 */
export function createFactorToken(
  factor = '',
  start_pos = 0,
  end_pos = 0,
  factorList = []
) {
  const index = factorList.findIndex((f) => f === factor)

  if (index >= 0) {
    return new Token({
      type: TokenType.Factor_Sign,
      value: factor,
      data: {
        id: factor,
        name: factor
      },
      start_pos,
      end_pos,
      priority: TokenPriority[TokenType.Factor_Sign]
    })
  } else {
    throw new ParseError({
      type: ParseErrorType.TokenizeError,
      message: new TokenizeErrorMessage({
        start_pos,
        end_pos,
        char: factor
      }).message
    })
  }
}

/**
 * @function
 * @description 将字符串解析成Token列表,支持不等式和四则运算
 * @param {string} formula
 * @param {Factor[]} factorList
 * @return {Token[]}
 */
export function tokenize(formula = '', factorList = []) {
  const formula_fmt = trim(formula)
  if (!formula_fmt) {
    throw new ParseError({
      type: ParseErrorType.TokenizeError,
      message: new TokenizeErrorMessage({ message: '公式不能为空!' }).message
    })
  }

  const tokens = []
  let current = ''
  let maybe_factor = ''
  let maybe_and_or = ''
  let start_pos = 0
  let enter_factor_range = false

  const char_exclude_num = [
    ...config.greater_less_sign,
    Start_Bracket,
    End_Bracket,
    ...config.calc_op_collector
  ]

  for (let index = 0; index < formula.length; index++) {
    const char = formula[index]

    const checkCurrent = () => {
      if (current) {
        if (!/^(\d+(\.\d+)?%$)|^\d+(\.\d+)?$/.test(current)) {
          throw new ParseError({
            type: ParseErrorType.TokenizeError,
            message: new TokenizeErrorMessage({
              start_pos,
              end_pos: index,
              char: current,
              message: '非法数字格式'
            }).message
          })
        }
        tokens.push(
          new Token({
            type: TokenType.Numeric,
            value: current,
            start_pos,
            end_pos: index - 1,
            priority: TokenPriority[TokenType.Numeric]
          })
        )
        current = ''
      }
    }

    const checkMaybeAndOr = () => {
      if (maybe_and_or) {
        if (
          !config.and_local_sign.some((a) => maybe_and_or === a) &&
          !config.or_locale_sign.some((a) => maybe_and_or === a)
        ) {
          throw new ParseError({
            type: ParseErrorType.TokenizeError,
            message: new TokenizeErrorMessage({
              start_pos,
              end_pos: index,
              char: maybe_and_or,
              message: '非法字符'
            }).message
          })
        }
        const tokenType = getTokenType(maybe_and_or, start_pos, index)
        tokens.push(
          new Token({
            type: tokenType,
            value: maybe_and_or,
            data: tokenType === TokenType.And_Sign ? And_Locale : Or_Locale,
            start_pos,
            end_pos: index - 1,
            priority: TokenPriority[tokenType]
          })
        )
        maybe_and_or = ''
      }
    }

    if (enter_factor_range && char !== End_Curly_Bracket) {
      maybe_factor += char
      continue
    }

    if (char === Start_Curly_Bracket) {
      checkMaybeAndOr()
      enter_factor_range = true
      start_pos = index
      continue
    }

    if (char === End_Curly_Bracket) {
      if (!enter_factor_range) {
        throw new ParseError({
          type: ParseErrorType.TokenizeError,
          message: new TokenizeErrorMessage({
            start_pos,
            end_pos: index,
            char: maybe_factor,
            message: '存在异常闭合花括号'
          }).message
        })
      }
      enter_factor_range = false
      continue
    }

    if (!enter_factor_range && maybe_factor) {
      tokens.push(
        createFactorToken(maybe_factor, start_pos, index - 1, factorList)
      )
      maybe_factor = ''
    }

    if (!trim(char)) continue

    if (All_Nums.includes(char) || config.special_numeric_char.includes(char)) {
      checkMaybeAndOr()
      if (!current) start_pos = index
      current += char
    } else if (
      (
        config.and_local_sign.join('') + config.or_locale_sign.join('')
      ).includes(char)
    ) {
      checkCurrent()
      if (!maybe_and_or) start_pos = index
      maybe_and_or += char
    } else if (char_exclude_num.includes(char)) {
      checkCurrent()
      checkMaybeAndOr()
      const tokenType = getTokenType(char, index, index)
      tokens.push(
        new Token({
          type: tokenType,
          value: char,
          start_pos: index,
          end_pos: index,
          priority: TokenPriority[tokenType]
        })
      )
    } else {
      throw new ParseError({
        type: ParseErrorType.TokenizeError,
        message: new TokenizeErrorMessage({
          start_pos,
          end_pos: index,
          char,
          message: '非法字符'
        }).message
      })
    }
  }

  if (current) {
    if (!/^(\d+(\.\d+)?%$)|^\d+(\.\d+)?$/.test(current)) {
      throw new ParseError({
        type: ParseErrorType.TokenizeError,
        message: new TokenizeErrorMessage({
          start_pos,
          end_pos: formula.length - 1,
          char: current,
          message: '非法数字格式'
        }).message
      })
    }
    tokens.push(
      new Token({
        type: TokenType.Numeric,
        value: current,
        start_pos,
        end_pos: formula.length - 1,
        priority: TokenPriority[TokenType.Numeric]
      })
    )
  }

  if (maybe_and_or) {
    throw new ParseError({
      type: ParseErrorType.TokenizeError,
      message: new TokenizeErrorMessage({
        start_pos,
        end_pos: formula.length - 1,
        char: maybe_and_or,
        message: '非法结尾的与或符号,或非法字符'
      }).message
    })
  }

  if (enter_factor_range) {
    throw new ParseError({
      type: ParseErrorType.TokenizeError,
      message: new TokenizeErrorMessage({
        start_pos,
        end_pos: formula.length - 1,
        char: maybe_factor,
        message: '缺少闭合花括号'
      }).message
    })
  }

  if (!enter_factor_range && maybe_factor) {
    tokens.push(
      createFactorToken(maybe_factor, start_pos, formula.length - 1, factorList)
    )
    maybe_factor = ''
  }

  return tokens
}

/**
 * @function
 * @description 根据ast树,计算结果,只支持四则运算 +,-,*,/,()
 * @param {Node} ast
 * @return {number}
 */
export function calc_expr_result(ast) {
  if (ast.token.type === TokenType.Numeric) {
    return ast.token.value.endsWith('%')
      ? parseFloat(ast.token.value) / 100
      : parseFloat(ast.token.value)
  }
  return match_calc_func(
    ast.token,
    calc_expr_result(ast.left),
    calc_expr_result(ast.right)
  )
}

// 递归打印树形数据（自上而下，同一级节点同行）
// 打印树形数据（自根节点从上往下）
export function printBinaryTree(node, prefix = '', isLeft = false) {
  if (node !== null) {
    if (node.token.type === TokenType.Factor_Expr) {
      node = node.token.node
    }
    console.log(`${prefix}${isLeft ? '├── ' : '└── '}${node.token.value}`) // 打印节点的值

    // 维护下一层级的缩进格式
    const newPrefix = `${prefix}${isLeft ? '│   ' : '    '}`

    // 递归打印左子树和右子树
    printBinaryTree(node.left, newPrefix, true)
    printBinaryTree(node.right, newPrefix, false)
  }
}

/**
 * @function
 * @param {Node} ast
 */
export function printAst(ast) {
  if (ast) {
    console.log(
      '开始打印树 ------------------------------------------------------------------------------------------'
    )
    printBinaryTree(ast)
    console.log(
      '打印结束 --------------------------------------------------------------------------------------------'
    )
  }
}

/**
 * @class
 * @classdesc 因子对象
 */
export class Factor {
  /**
   * @description 因子id
   * @type {string}
   */
  id

  /**
   * @description 因子名称
   * @type {string}
   */
  name

  constructor({ id, name }) {
    this.id = id
    this.name = name
  }
}

/**
 * @function
 * @description 通过tokens构建formula
 * @param {Token[]} tokens
 * @param {boolean} wrapFactor
 * @param {Factor[]} factorList
 * @returns {string}
 */
export function createFormulaFromTokens(tokens = [], wrapFactor = true) {
  return tokens.reduce((prv, next) => {
    if (next.type === TokenType.Factor_Sign) {
      prv += wrapFactor ? `{${next.value}}` : next.value
    } else if ([TokenType.And_Sign, TokenType.Or_Sign].includes(next.type)) {
      prv += next.data[localStorage.getItem('g_sfa_lang')]
    } else {
      prv += next.value
    }
    return prv
  }, '')
}
/**
 * @function
 * @description 根据factor id获取名称
 * @param {string} id
 * @param {Factor[]} factorList
 * @return {string}
 */
export function getFactorNameById(id = '', factorList = []) {
  const index = factorList.findIndex((factor) => factor.id === id)
  if (index >= 0) {
    return factorList[index].name
  }
  return ''
}

/**
 * @function
 * @description 获取当前locale
 * @returns {string}
 */
export function getCurrentLocale() {
  return localStorage.getItem('g_sfa_lang')
}

/**
 * @function
 * @description 获取token对应展示的文案
 * @param {Token} token
 * @returns {string}
 */
export function getDisplayContent(token) {
  switch (token.type) {
    case TokenType.Factor_Sign:
      return token.data.name
    case TokenType.And_Sign:
      return token.data[getCurrentLocale()]
    case TokenType.Or_Sign:
      return token.data[getCurrentLocale()]
    default:
      return token.value
  }
}
