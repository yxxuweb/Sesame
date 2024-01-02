/**
 * 参考扩展巴科斯范式(EBNF)
 *
 * ----> 核心结构
 * expr = as_expr , { ("+"|"-") , as_expr };
 * as_expr = md_expr , { ("*"|"/") , md_expr };
 * md_expr = number | "(" , expr , ")";
 *
 * ----> 变量定义
 * number = int | float;
 * int = digit_no_zero , { digit };
 * float = digit , { digit } , [ "." , digit , { digit } ]
 * digit = digit_zero | digit_no_zero;
 * digit_no_zero = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
 * digit_zero = "0";
 */
import {
  TokenType,
  ParseError,
  ParseErrorType,
  ParseAstErrorMessage,
  Node,
  calc_expr_result,
  tokenize,
  Factor,
} from './lexter';

/**
 * @class
 * @classdesc 四则运算解析控制类
 */
export class CalcController {
  /**
   * @description 字符串公式
   * @type {string}
   */
  expr = '';

  /**
   * @description 解析之后的tokens集合
   * @type {Token[]}
   */
  tokens = [];

  /**
   * @description 基于expr生成的ast节点树
   * @type {Node}
   */
  ast = null;

  /**
   * @description 临时存储ast节点容器
   * @type {Node[]}
   */
  node_stack = [];

  /**
   * @description 错误信息
   * @type {ParseError}
   */
  error_info = null;

  /**
   * @description 解析AST使用的index
   * @type {number}
   */
  index_for_parse = 0;

  /**
   * @description 四则运算的结果
   * @type {number}
   */
  result = 0;

  /**
   * @description 因子列表
   * @type {Factor[]}
   */
  factorList = [];

  /**
   * @description 操作符集合
   * @type {[string,string]}
   */
  op_collector = [TokenType.Add_Sub, TokenType.Multi_Div];

  /**
   * @description 四则运算是否包含因子
   * @type {boolean}
   */
  contain_factor = false;

  /**
   * @constructor
   * @param {string} expr
   * @param {Token[]} tokens
   * @param {string[]} factorList
   * @param {Factor[]} factorObjList
   */
  constructor({ expr = '', tokens = [], factorList = [], factorObjList = [] }) {
    if (expr) {
      this.expr = expr;
      this.factorList = factorList.map((v, i) => {
        return new Factor({
          name: v,
          id: i,
        });
      });
      try {
        console.time('Tokenize calc time');
        this.tokens = tokenize(this.expr, this.factorList);
        console.timeEnd('Tokenize calc time');
        console.time('Parse calc ast time');
        this.ast = this.parser();
        console.timeEnd('Parse calc ast time');
        if (!this.contain_factor) this.result = this.calc();
      } catch (error) {
        this.error_info = error;
      }
    } else if (tokens.length > 0) {
      this.createExprFromTokens(tokens);
      this.tokens = tokens;
      this.factorList = factorObjList;
      try {
        console.time('Parse calc ast time (Tokens)');
        this.ast = this.parser();
        console.timeEnd('Parse calc ast time (Tokens)');
        if (!this.contain_factor) this.result = this.calc();
      } catch (error) {
        this.error_info = error;
      }
    }
  }

  /**
   * @function
   * @description 特殊情况,从tokens构建expr
   * @param {Token[]} tokens
   */
  createExprFromTokens(tokens = []) {
    this.expr = tokens.reduce((prev, next) => {
      if (next?.value) {
        return prev + next.value;
      }
      return prev;
    }, '');
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
          message: '待解析的Tokens列表不能为空!',
        }).message,
      });
    }
    // 重置启动index,避免干扰
    this.index_for_parse = 0;
    // 构建node_stack
    this.parser_match();
    this.ast = this.node_stack[0];
    return this.ast;
  }

  /**
   * @function
   * @description 起始括号的处理
   * @param {Node} node
   */
  do_start_brackets(node) {
    this.node_stack.push(node);
    this.index_for_parse++;
    this.parser_match.call(this);
  }

  /**
   * @function
   * @description 向node_stack中添加纯数字节点
   * @param {Token} token
   * @param {Node|null} target_node
   * @return {Node}
   */
  push_numeric_node(token, target_node = null) {
    if (!target_node) {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: token.start_pos,
          end_pos: token.end_pos,
          value: token.value,
          addition_message: '纯数字不是合法公式!',
        }).message,
      });
    }

    let recursive_node = target_node;

    if (!this.op_collector.includes(recursive_node.token.type)) {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: token.start_pos,
          end_pos: token.end_pos,
          value: token.value,
          addition_message: '前置位置没有合法操作字符!',
        }).message,
      });
    }

    while (recursive_node.right) {
      recursive_node = recursive_node.right;
    }

    if (
      !this.op_collector.includes(recursive_node.token.type) ||
      recursive_node.right
    ) {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: token.start_pos,
          end_pos: token.end_pos,
          value: token.value,
          addition_message: '前置位置没有合法操作字符!',
        }).message,
      });
    }

    recursive_node.right = new Node({ token });
    return target_node;
  }

  /**
   * @function
   * @description 递归添加节点
   * @param {Node} node
   * @param {Node} target_node
   */
  recursive_add_node(node, target_node) {
    let recursive_node = target_node;
    const n_priority = node.token.priority;
    let cache_upper_node = null;
    const cache_left_node = node.left;
    let back_node = null;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (recursive_node.token.priority < n_priority || node.complete) {
        if (!recursive_node.right) {
          recursive_node.right = node;
          back_node = target_node;
          break;
        } else {
          cache_upper_node = recursive_node;
          recursive_node = recursive_node.right;
        }
      } else {
        if (!recursive_node.right) {
          recursive_node.right = cache_left_node;
          node.left = recursive_node;
          if (cache_upper_node) {
            cache_upper_node.right = node;
            back_node = target_node;
          } else {
            back_node = node;
          }
          break;
        } else {
          cache_upper_node = recursive_node;
          recursive_node = recursive_node.right;
        }
      }
    }

    return back_node;
  }

  /**
   * @function
   * @description 添加操作符节点
   * @param {Node} node
   */
  push_op_node(node) {
    const stack_top_node = this.node_stack.pop();
    if (!stack_top_node) {
      this.node_stack.push(node);
      return;
    }

    const new_stack_top_node = this.recursive_add_node(node, stack_top_node);
    this.node_stack.push(new_stack_top_node);
  }

  /**
   * @function
   * @description 下一个Token是操作符时的处理
   * @param {Node} node
   */
  do_op(node) {
    const current_token = node.left.token;
    if (this.node_stack.length === 0) this.node_stack.push(node);
    else {
      const stack_top_node = this.node_stack[this.node_stack.length - 1];
      if (stack_top_node.token.type === TokenType.Start_Brackets) {
        this.node_stack.push(node);
      } else if (this.op_collector.includes(stack_top_node.token.type)) {
        this.push_op_node(node);
      } else {
        throw new ParseError({
          type: ParseErrorType.ParseAstError,
          message: new ParseAstErrorMessage({
            start_pos: current_token.start_pos,
            end_pos: current_token.end_pos,
            value: current_token.value,
          }).message,
        });
      }
    }
    this.index_for_parse++;
    this.parser_match.call(this);
  }

  /**
   * @function
   * @description 下一个Token是关闭括号时的处理
   * @param {Node} node
   * @param {Token} bracket_token
   */
  do_end_brackets(node, bracket_token) {
    const current_token = node.token;
    if (this.node_stack.length === 0) {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: bracket_token.start_pos,
          end_pos: bracket_token.end_pos,
          value: bracket_token.value,
          addition_message: '非法括号!',
        }).message,
      });
    }
    const stack_top_node = this.node_stack[this.node_stack.length - 1];

    if (!this.op_collector.includes(stack_top_node.token.type)) {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: bracket_token.start_pos,
          end_pos: bracket_token.end_pos,
          value: bracket_token.value,
          addition_message: '无效括号!',
        }).message,
      });
    }

    if (
      [TokenType.Numeric, TokenType.Factor_Sign].includes(current_token.type)
    ) {
      this.push_numeric_node(current_token, stack_top_node);
    } else if (this.op_collector.includes(current_token.type)) {
      this.do_op.call(this, node);
    } else {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: bracket_token.start_pos,
          end_pos: bracket_token.end_pos,
          value: bracket_token.value,
          addition_message: '括号内存在非法字符!',
        }).message,
      });
    }

    const stack_pop_node = this.node_stack.pop();
    stack_pop_node.complete = true;
    const maybe_start_bracket_node = this.node_stack.pop();

    if (!maybe_start_bracket_node) {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: bracket_token.start_pos,
          end_pos: bracket_token.end_pos,
          value: bracket_token.value,
          addition_message: '非法闭合括号!',
        }).message,
      });
    }

    if (maybe_start_bracket_node.token.type !== TokenType.Start_Brackets) {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: bracket_token.start_pos,
          end_pos: bracket_token.end_pos,
          value: bracket_token.value,
          addition_message: '无匹配括号!',
        }).message,
      });
    }

    const after_bracket_token = this.tokens[++this.index_for_parse];
    if (after_bracket_token) {
      if (this.op_collector.includes(after_bracket_token.type)) {
        const new_node = new Node({
          token: after_bracket_token,
          left: stack_pop_node,
        });
        this.do_op.call(this, new_node);
      } else if (after_bracket_token.type === TokenType.End_Brackets) {
        this.do_end_brackets.call(this, stack_pop_node, after_bracket_token);
      } else {
        throw new ParseError({
          type: ParseErrorType.ParseAstError,
          message: new ParseAstErrorMessage({
            start_pos: after_bracket_token.start_pos,
            end_pos: after_bracket_token.end_pos,
            value: after_bracket_token.value,
            addition_message: '非法字符!',
          }).message,
        });
      }
      // EOF
    } else {
      this.push_op_node.call(this, stack_pop_node);
    }
  }

  do_numeric(token) {
    const next_token = this.tokens[++this.index_for_parse];
    if (!next_token) {
      this.push_numeric_node(
        token,
        this.node_stack[this.node_stack.length - 1]
      );
    } else if (next_token.type === TokenType.End_Brackets) {
      this.do_end_brackets(new Node({ token }), next_token);
    } else if (this.op_collector.includes(next_token.type)) {
      this.do_op(
        new Node({
          token: next_token,
          left: new Node({ token }),
        })
      );
    } else {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: token.start_pos,
          end_pos: token.end_pos,
          value: token.value,
        }).message,
      });
    }
  }

  /**
   * @function
   * @description 解析模式集合
   */
  parser_match() {
    if (this.index_for_parse > this.tokens.length - 1) return;
    const current_token = this.tokens[this.index_for_parse];

    switch (current_token.type) {
      case TokenType.Start_Brackets:
        this.do_start_brackets(
          new Node({
            token: current_token,
          })
        );
        break;
      case TokenType.Numeric:
        this.do_numeric(current_token);
        break;
      case TokenType.Factor_Sign:
        this.contain_factor = true;
        this.do_numeric(current_token);
        break;
      default:
        throw new ParseError({
          type: ParseErrorType.ParseAstError,
          message: new ParseAstErrorMessage({
            start_pos: current_token.start_pos,
            end_pos: current_token.end_pos,
            value: current_token.value,
            addition_message: '存在非法字符!',
          }).message,
        });
    }
    const index = this.node_stack.findIndex(
      (s) => s.token.type === TokenType.Start_Brackets
    );
    if (index >= 0) {
      const error_node = this.node_stack[index];
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: error_node.token.start_pos,
          end_pos: error_node.token.end_pos,
          value: error_node.token.value,
          addition_message: '缺少匹配的括号!',
        }).message,
      });
    }

    this.check_full_tree();
  }

  /**
   * @function
   * @description 校验右子节点是否有值
   */
  check_full_tree() {
    let recursive_node = this.node_stack[0];
    while (recursive_node.right) {
      recursive_node = recursive_node.right;
    }

    if (
      ![TokenType.Numeric, TokenType.Factor_Sign].includes(
        recursive_node.token.type
      )
    ) {
      throw new ParseError({
        type: ParseErrorType.ParseAstError,
        message: new ParseAstErrorMessage({
          start_pos: recursive_node.token.start_pos,
          end_pos: recursive_node.token.end_pos,
          value: recursive_node.token.value,
          addition_message: '操作符右侧缺少结束数字节点!',
        }).message,
      });
    }
  }

  /**
   * @function
   * @description 计算四则运算结果
   */
  calc() {
    return calc_expr_result(this.ast);
  }
}
