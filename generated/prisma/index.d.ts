
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model SocialFacility
 * 
 */
export type SocialFacility = $Result.DefaultSelection<Prisma.$SocialFacilityPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more SocialFacilities
 * const socialFacilities = await prisma.socialFacility.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more SocialFacilities
   * const socialFacilities = await prisma.socialFacility.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.socialFacility`: Exposes CRUD operations for the **SocialFacility** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SocialFacilities
    * const socialFacilities = await prisma.socialFacility.findMany()
    * ```
    */
  get socialFacility(): Prisma.SocialFacilityDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.17.1
   * Query Engine version: 272a37d34178c2894197e17273bf937f25acdeac
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    SocialFacility: 'SocialFacility'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "socialFacility"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      SocialFacility: {
        payload: Prisma.$SocialFacilityPayload<ExtArgs>
        fields: Prisma.SocialFacilityFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SocialFacilityFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialFacilityPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SocialFacilityFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialFacilityPayload>
          }
          findFirst: {
            args: Prisma.SocialFacilityFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialFacilityPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SocialFacilityFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialFacilityPayload>
          }
          findMany: {
            args: Prisma.SocialFacilityFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialFacilityPayload>[]
          }
          create: {
            args: Prisma.SocialFacilityCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialFacilityPayload>
          }
          createMany: {
            args: Prisma.SocialFacilityCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SocialFacilityCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialFacilityPayload>[]
          }
          delete: {
            args: Prisma.SocialFacilityDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialFacilityPayload>
          }
          update: {
            args: Prisma.SocialFacilityUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialFacilityPayload>
          }
          deleteMany: {
            args: Prisma.SocialFacilityDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SocialFacilityUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SocialFacilityUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialFacilityPayload>[]
          }
          upsert: {
            args: Prisma.SocialFacilityUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SocialFacilityPayload>
          }
          aggregate: {
            args: Prisma.SocialFacilityAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSocialFacility>
          }
          groupBy: {
            args: Prisma.SocialFacilityGroupByArgs<ExtArgs>
            result: $Utils.Optional<SocialFacilityGroupByOutputType>[]
          }
          count: {
            args: Prisma.SocialFacilityCountArgs<ExtArgs>
            result: $Utils.Optional<SocialFacilityCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    socialFacility?: SocialFacilityOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model SocialFacility
   */

  export type AggregateSocialFacility = {
    _count: SocialFacilityCountAggregateOutputType | null
    _avg: SocialFacilityAvgAggregateOutputType | null
    _sum: SocialFacilitySumAggregateOutputType | null
    _min: SocialFacilityMinAggregateOutputType | null
    _max: SocialFacilityMaxAggregateOutputType | null
  }

  export type SocialFacilityAvgAggregateOutputType = {
    id: number | null
  }

  export type SocialFacilitySumAggregateOutputType = {
    id: number | null
  }

  export type SocialFacilityMinAggregateOutputType = {
    id: number | null
    name: string | null
    workingHours: string | null
    rules: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SocialFacilityMaxAggregateOutputType = {
    id: number | null
    name: string | null
    workingHours: string | null
    rules: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SocialFacilityCountAggregateOutputType = {
    id: number
    name: number
    workingHours: number
    rules: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SocialFacilityAvgAggregateInputType = {
    id?: true
  }

  export type SocialFacilitySumAggregateInputType = {
    id?: true
  }

  export type SocialFacilityMinAggregateInputType = {
    id?: true
    name?: true
    workingHours?: true
    rules?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SocialFacilityMaxAggregateInputType = {
    id?: true
    name?: true
    workingHours?: true
    rules?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SocialFacilityCountAggregateInputType = {
    id?: true
    name?: true
    workingHours?: true
    rules?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SocialFacilityAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SocialFacility to aggregate.
     */
    where?: SocialFacilityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SocialFacilities to fetch.
     */
    orderBy?: SocialFacilityOrderByWithRelationInput | SocialFacilityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SocialFacilityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SocialFacilities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SocialFacilities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SocialFacilities
    **/
    _count?: true | SocialFacilityCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SocialFacilityAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SocialFacilitySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SocialFacilityMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SocialFacilityMaxAggregateInputType
  }

  export type GetSocialFacilityAggregateType<T extends SocialFacilityAggregateArgs> = {
        [P in keyof T & keyof AggregateSocialFacility]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSocialFacility[P]>
      : GetScalarType<T[P], AggregateSocialFacility[P]>
  }




  export type SocialFacilityGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SocialFacilityWhereInput
    orderBy?: SocialFacilityOrderByWithAggregationInput | SocialFacilityOrderByWithAggregationInput[]
    by: SocialFacilityScalarFieldEnum[] | SocialFacilityScalarFieldEnum
    having?: SocialFacilityScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SocialFacilityCountAggregateInputType | true
    _avg?: SocialFacilityAvgAggregateInputType
    _sum?: SocialFacilitySumAggregateInputType
    _min?: SocialFacilityMinAggregateInputType
    _max?: SocialFacilityMaxAggregateInputType
  }

  export type SocialFacilityGroupByOutputType = {
    id: number
    name: string
    workingHours: string
    rules: string
    createdAt: Date
    updatedAt: Date
    _count: SocialFacilityCountAggregateOutputType | null
    _avg: SocialFacilityAvgAggregateOutputType | null
    _sum: SocialFacilitySumAggregateOutputType | null
    _min: SocialFacilityMinAggregateOutputType | null
    _max: SocialFacilityMaxAggregateOutputType | null
  }

  type GetSocialFacilityGroupByPayload<T extends SocialFacilityGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SocialFacilityGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SocialFacilityGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SocialFacilityGroupByOutputType[P]>
            : GetScalarType<T[P], SocialFacilityGroupByOutputType[P]>
        }
      >
    >


  export type SocialFacilitySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    workingHours?: boolean
    rules?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["socialFacility"]>

  export type SocialFacilitySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    workingHours?: boolean
    rules?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["socialFacility"]>

  export type SocialFacilitySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    workingHours?: boolean
    rules?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["socialFacility"]>

  export type SocialFacilitySelectScalar = {
    id?: boolean
    name?: boolean
    workingHours?: boolean
    rules?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SocialFacilityOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "workingHours" | "rules" | "createdAt" | "updatedAt", ExtArgs["result"]["socialFacility"]>

  export type $SocialFacilityPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SocialFacility"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      workingHours: string
      rules: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["socialFacility"]>
    composites: {}
  }

  type SocialFacilityGetPayload<S extends boolean | null | undefined | SocialFacilityDefaultArgs> = $Result.GetResult<Prisma.$SocialFacilityPayload, S>

  type SocialFacilityCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SocialFacilityFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SocialFacilityCountAggregateInputType | true
    }

  export interface SocialFacilityDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SocialFacility'], meta: { name: 'SocialFacility' } }
    /**
     * Find zero or one SocialFacility that matches the filter.
     * @param {SocialFacilityFindUniqueArgs} args - Arguments to find a SocialFacility
     * @example
     * // Get one SocialFacility
     * const socialFacility = await prisma.socialFacility.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SocialFacilityFindUniqueArgs>(args: SelectSubset<T, SocialFacilityFindUniqueArgs<ExtArgs>>): Prisma__SocialFacilityClient<$Result.GetResult<Prisma.$SocialFacilityPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SocialFacility that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SocialFacilityFindUniqueOrThrowArgs} args - Arguments to find a SocialFacility
     * @example
     * // Get one SocialFacility
     * const socialFacility = await prisma.socialFacility.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SocialFacilityFindUniqueOrThrowArgs>(args: SelectSubset<T, SocialFacilityFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SocialFacilityClient<$Result.GetResult<Prisma.$SocialFacilityPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SocialFacility that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SocialFacilityFindFirstArgs} args - Arguments to find a SocialFacility
     * @example
     * // Get one SocialFacility
     * const socialFacility = await prisma.socialFacility.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SocialFacilityFindFirstArgs>(args?: SelectSubset<T, SocialFacilityFindFirstArgs<ExtArgs>>): Prisma__SocialFacilityClient<$Result.GetResult<Prisma.$SocialFacilityPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SocialFacility that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SocialFacilityFindFirstOrThrowArgs} args - Arguments to find a SocialFacility
     * @example
     * // Get one SocialFacility
     * const socialFacility = await prisma.socialFacility.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SocialFacilityFindFirstOrThrowArgs>(args?: SelectSubset<T, SocialFacilityFindFirstOrThrowArgs<ExtArgs>>): Prisma__SocialFacilityClient<$Result.GetResult<Prisma.$SocialFacilityPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SocialFacilities that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SocialFacilityFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SocialFacilities
     * const socialFacilities = await prisma.socialFacility.findMany()
     * 
     * // Get first 10 SocialFacilities
     * const socialFacilities = await prisma.socialFacility.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const socialFacilityWithIdOnly = await prisma.socialFacility.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SocialFacilityFindManyArgs>(args?: SelectSubset<T, SocialFacilityFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SocialFacilityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SocialFacility.
     * @param {SocialFacilityCreateArgs} args - Arguments to create a SocialFacility.
     * @example
     * // Create one SocialFacility
     * const SocialFacility = await prisma.socialFacility.create({
     *   data: {
     *     // ... data to create a SocialFacility
     *   }
     * })
     * 
     */
    create<T extends SocialFacilityCreateArgs>(args: SelectSubset<T, SocialFacilityCreateArgs<ExtArgs>>): Prisma__SocialFacilityClient<$Result.GetResult<Prisma.$SocialFacilityPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SocialFacilities.
     * @param {SocialFacilityCreateManyArgs} args - Arguments to create many SocialFacilities.
     * @example
     * // Create many SocialFacilities
     * const socialFacility = await prisma.socialFacility.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SocialFacilityCreateManyArgs>(args?: SelectSubset<T, SocialFacilityCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SocialFacilities and returns the data saved in the database.
     * @param {SocialFacilityCreateManyAndReturnArgs} args - Arguments to create many SocialFacilities.
     * @example
     * // Create many SocialFacilities
     * const socialFacility = await prisma.socialFacility.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SocialFacilities and only return the `id`
     * const socialFacilityWithIdOnly = await prisma.socialFacility.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SocialFacilityCreateManyAndReturnArgs>(args?: SelectSubset<T, SocialFacilityCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SocialFacilityPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SocialFacility.
     * @param {SocialFacilityDeleteArgs} args - Arguments to delete one SocialFacility.
     * @example
     * // Delete one SocialFacility
     * const SocialFacility = await prisma.socialFacility.delete({
     *   where: {
     *     // ... filter to delete one SocialFacility
     *   }
     * })
     * 
     */
    delete<T extends SocialFacilityDeleteArgs>(args: SelectSubset<T, SocialFacilityDeleteArgs<ExtArgs>>): Prisma__SocialFacilityClient<$Result.GetResult<Prisma.$SocialFacilityPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SocialFacility.
     * @param {SocialFacilityUpdateArgs} args - Arguments to update one SocialFacility.
     * @example
     * // Update one SocialFacility
     * const socialFacility = await prisma.socialFacility.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SocialFacilityUpdateArgs>(args: SelectSubset<T, SocialFacilityUpdateArgs<ExtArgs>>): Prisma__SocialFacilityClient<$Result.GetResult<Prisma.$SocialFacilityPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SocialFacilities.
     * @param {SocialFacilityDeleteManyArgs} args - Arguments to filter SocialFacilities to delete.
     * @example
     * // Delete a few SocialFacilities
     * const { count } = await prisma.socialFacility.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SocialFacilityDeleteManyArgs>(args?: SelectSubset<T, SocialFacilityDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SocialFacilities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SocialFacilityUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SocialFacilities
     * const socialFacility = await prisma.socialFacility.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SocialFacilityUpdateManyArgs>(args: SelectSubset<T, SocialFacilityUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SocialFacilities and returns the data updated in the database.
     * @param {SocialFacilityUpdateManyAndReturnArgs} args - Arguments to update many SocialFacilities.
     * @example
     * // Update many SocialFacilities
     * const socialFacility = await prisma.socialFacility.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SocialFacilities and only return the `id`
     * const socialFacilityWithIdOnly = await prisma.socialFacility.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SocialFacilityUpdateManyAndReturnArgs>(args: SelectSubset<T, SocialFacilityUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SocialFacilityPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SocialFacility.
     * @param {SocialFacilityUpsertArgs} args - Arguments to update or create a SocialFacility.
     * @example
     * // Update or create a SocialFacility
     * const socialFacility = await prisma.socialFacility.upsert({
     *   create: {
     *     // ... data to create a SocialFacility
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SocialFacility we want to update
     *   }
     * })
     */
    upsert<T extends SocialFacilityUpsertArgs>(args: SelectSubset<T, SocialFacilityUpsertArgs<ExtArgs>>): Prisma__SocialFacilityClient<$Result.GetResult<Prisma.$SocialFacilityPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SocialFacilities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SocialFacilityCountArgs} args - Arguments to filter SocialFacilities to count.
     * @example
     * // Count the number of SocialFacilities
     * const count = await prisma.socialFacility.count({
     *   where: {
     *     // ... the filter for the SocialFacilities we want to count
     *   }
     * })
    **/
    count<T extends SocialFacilityCountArgs>(
      args?: Subset<T, SocialFacilityCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SocialFacilityCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SocialFacility.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SocialFacilityAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SocialFacilityAggregateArgs>(args: Subset<T, SocialFacilityAggregateArgs>): Prisma.PrismaPromise<GetSocialFacilityAggregateType<T>>

    /**
     * Group by SocialFacility.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SocialFacilityGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SocialFacilityGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SocialFacilityGroupByArgs['orderBy'] }
        : { orderBy?: SocialFacilityGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SocialFacilityGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSocialFacilityGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SocialFacility model
   */
  readonly fields: SocialFacilityFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SocialFacility.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SocialFacilityClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SocialFacility model
   */
  interface SocialFacilityFieldRefs {
    readonly id: FieldRef<"SocialFacility", 'Int'>
    readonly name: FieldRef<"SocialFacility", 'String'>
    readonly workingHours: FieldRef<"SocialFacility", 'String'>
    readonly rules: FieldRef<"SocialFacility", 'String'>
    readonly createdAt: FieldRef<"SocialFacility", 'DateTime'>
    readonly updatedAt: FieldRef<"SocialFacility", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SocialFacility findUnique
   */
  export type SocialFacilityFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialFacility
     */
    select?: SocialFacilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialFacility
     */
    omit?: SocialFacilityOmit<ExtArgs> | null
    /**
     * Filter, which SocialFacility to fetch.
     */
    where: SocialFacilityWhereUniqueInput
  }

  /**
   * SocialFacility findUniqueOrThrow
   */
  export type SocialFacilityFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialFacility
     */
    select?: SocialFacilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialFacility
     */
    omit?: SocialFacilityOmit<ExtArgs> | null
    /**
     * Filter, which SocialFacility to fetch.
     */
    where: SocialFacilityWhereUniqueInput
  }

  /**
   * SocialFacility findFirst
   */
  export type SocialFacilityFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialFacility
     */
    select?: SocialFacilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialFacility
     */
    omit?: SocialFacilityOmit<ExtArgs> | null
    /**
     * Filter, which SocialFacility to fetch.
     */
    where?: SocialFacilityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SocialFacilities to fetch.
     */
    orderBy?: SocialFacilityOrderByWithRelationInput | SocialFacilityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SocialFacilities.
     */
    cursor?: SocialFacilityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SocialFacilities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SocialFacilities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SocialFacilities.
     */
    distinct?: SocialFacilityScalarFieldEnum | SocialFacilityScalarFieldEnum[]
  }

  /**
   * SocialFacility findFirstOrThrow
   */
  export type SocialFacilityFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialFacility
     */
    select?: SocialFacilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialFacility
     */
    omit?: SocialFacilityOmit<ExtArgs> | null
    /**
     * Filter, which SocialFacility to fetch.
     */
    where?: SocialFacilityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SocialFacilities to fetch.
     */
    orderBy?: SocialFacilityOrderByWithRelationInput | SocialFacilityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SocialFacilities.
     */
    cursor?: SocialFacilityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SocialFacilities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SocialFacilities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SocialFacilities.
     */
    distinct?: SocialFacilityScalarFieldEnum | SocialFacilityScalarFieldEnum[]
  }

  /**
   * SocialFacility findMany
   */
  export type SocialFacilityFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialFacility
     */
    select?: SocialFacilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialFacility
     */
    omit?: SocialFacilityOmit<ExtArgs> | null
    /**
     * Filter, which SocialFacilities to fetch.
     */
    where?: SocialFacilityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SocialFacilities to fetch.
     */
    orderBy?: SocialFacilityOrderByWithRelationInput | SocialFacilityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SocialFacilities.
     */
    cursor?: SocialFacilityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SocialFacilities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SocialFacilities.
     */
    skip?: number
    distinct?: SocialFacilityScalarFieldEnum | SocialFacilityScalarFieldEnum[]
  }

  /**
   * SocialFacility create
   */
  export type SocialFacilityCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialFacility
     */
    select?: SocialFacilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialFacility
     */
    omit?: SocialFacilityOmit<ExtArgs> | null
    /**
     * The data needed to create a SocialFacility.
     */
    data: XOR<SocialFacilityCreateInput, SocialFacilityUncheckedCreateInput>
  }

  /**
   * SocialFacility createMany
   */
  export type SocialFacilityCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SocialFacilities.
     */
    data: SocialFacilityCreateManyInput | SocialFacilityCreateManyInput[]
  }

  /**
   * SocialFacility createManyAndReturn
   */
  export type SocialFacilityCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialFacility
     */
    select?: SocialFacilitySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SocialFacility
     */
    omit?: SocialFacilityOmit<ExtArgs> | null
    /**
     * The data used to create many SocialFacilities.
     */
    data: SocialFacilityCreateManyInput | SocialFacilityCreateManyInput[]
  }

  /**
   * SocialFacility update
   */
  export type SocialFacilityUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialFacility
     */
    select?: SocialFacilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialFacility
     */
    omit?: SocialFacilityOmit<ExtArgs> | null
    /**
     * The data needed to update a SocialFacility.
     */
    data: XOR<SocialFacilityUpdateInput, SocialFacilityUncheckedUpdateInput>
    /**
     * Choose, which SocialFacility to update.
     */
    where: SocialFacilityWhereUniqueInput
  }

  /**
   * SocialFacility updateMany
   */
  export type SocialFacilityUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SocialFacilities.
     */
    data: XOR<SocialFacilityUpdateManyMutationInput, SocialFacilityUncheckedUpdateManyInput>
    /**
     * Filter which SocialFacilities to update
     */
    where?: SocialFacilityWhereInput
    /**
     * Limit how many SocialFacilities to update.
     */
    limit?: number
  }

  /**
   * SocialFacility updateManyAndReturn
   */
  export type SocialFacilityUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialFacility
     */
    select?: SocialFacilitySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SocialFacility
     */
    omit?: SocialFacilityOmit<ExtArgs> | null
    /**
     * The data used to update SocialFacilities.
     */
    data: XOR<SocialFacilityUpdateManyMutationInput, SocialFacilityUncheckedUpdateManyInput>
    /**
     * Filter which SocialFacilities to update
     */
    where?: SocialFacilityWhereInput
    /**
     * Limit how many SocialFacilities to update.
     */
    limit?: number
  }

  /**
   * SocialFacility upsert
   */
  export type SocialFacilityUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialFacility
     */
    select?: SocialFacilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialFacility
     */
    omit?: SocialFacilityOmit<ExtArgs> | null
    /**
     * The filter to search for the SocialFacility to update in case it exists.
     */
    where: SocialFacilityWhereUniqueInput
    /**
     * In case the SocialFacility found by the `where` argument doesn't exist, create a new SocialFacility with this data.
     */
    create: XOR<SocialFacilityCreateInput, SocialFacilityUncheckedCreateInput>
    /**
     * In case the SocialFacility was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SocialFacilityUpdateInput, SocialFacilityUncheckedUpdateInput>
  }

  /**
   * SocialFacility delete
   */
  export type SocialFacilityDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialFacility
     */
    select?: SocialFacilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialFacility
     */
    omit?: SocialFacilityOmit<ExtArgs> | null
    /**
     * Filter which SocialFacility to delete.
     */
    where: SocialFacilityWhereUniqueInput
  }

  /**
   * SocialFacility deleteMany
   */
  export type SocialFacilityDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SocialFacilities to delete
     */
    where?: SocialFacilityWhereInput
    /**
     * Limit how many SocialFacilities to delete.
     */
    limit?: number
  }

  /**
   * SocialFacility without action
   */
  export type SocialFacilityDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SocialFacility
     */
    select?: SocialFacilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SocialFacility
     */
    omit?: SocialFacilityOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const SocialFacilityScalarFieldEnum: {
    id: 'id',
    name: 'name',
    workingHours: 'workingHours',
    rules: 'rules',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SocialFacilityScalarFieldEnum = (typeof SocialFacilityScalarFieldEnum)[keyof typeof SocialFacilityScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type SocialFacilityWhereInput = {
    AND?: SocialFacilityWhereInput | SocialFacilityWhereInput[]
    OR?: SocialFacilityWhereInput[]
    NOT?: SocialFacilityWhereInput | SocialFacilityWhereInput[]
    id?: IntFilter<"SocialFacility"> | number
    name?: StringFilter<"SocialFacility"> | string
    workingHours?: StringFilter<"SocialFacility"> | string
    rules?: StringFilter<"SocialFacility"> | string
    createdAt?: DateTimeFilter<"SocialFacility"> | Date | string
    updatedAt?: DateTimeFilter<"SocialFacility"> | Date | string
  }

  export type SocialFacilityOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    workingHours?: SortOrder
    rules?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SocialFacilityWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: SocialFacilityWhereInput | SocialFacilityWhereInput[]
    OR?: SocialFacilityWhereInput[]
    NOT?: SocialFacilityWhereInput | SocialFacilityWhereInput[]
    name?: StringFilter<"SocialFacility"> | string
    workingHours?: StringFilter<"SocialFacility"> | string
    rules?: StringFilter<"SocialFacility"> | string
    createdAt?: DateTimeFilter<"SocialFacility"> | Date | string
    updatedAt?: DateTimeFilter<"SocialFacility"> | Date | string
  }, "id">

  export type SocialFacilityOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    workingHours?: SortOrder
    rules?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SocialFacilityCountOrderByAggregateInput
    _avg?: SocialFacilityAvgOrderByAggregateInput
    _max?: SocialFacilityMaxOrderByAggregateInput
    _min?: SocialFacilityMinOrderByAggregateInput
    _sum?: SocialFacilitySumOrderByAggregateInput
  }

  export type SocialFacilityScalarWhereWithAggregatesInput = {
    AND?: SocialFacilityScalarWhereWithAggregatesInput | SocialFacilityScalarWhereWithAggregatesInput[]
    OR?: SocialFacilityScalarWhereWithAggregatesInput[]
    NOT?: SocialFacilityScalarWhereWithAggregatesInput | SocialFacilityScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"SocialFacility"> | number
    name?: StringWithAggregatesFilter<"SocialFacility"> | string
    workingHours?: StringWithAggregatesFilter<"SocialFacility"> | string
    rules?: StringWithAggregatesFilter<"SocialFacility"> | string
    createdAt?: DateTimeWithAggregatesFilter<"SocialFacility"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SocialFacility"> | Date | string
  }

  export type SocialFacilityCreateInput = {
    name: string
    workingHours: string
    rules: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SocialFacilityUncheckedCreateInput = {
    id?: number
    name: string
    workingHours: string
    rules: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SocialFacilityUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    workingHours?: StringFieldUpdateOperationsInput | string
    rules?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SocialFacilityUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    workingHours?: StringFieldUpdateOperationsInput | string
    rules?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SocialFacilityCreateManyInput = {
    id?: number
    name: string
    workingHours: string
    rules: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SocialFacilityUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    workingHours?: StringFieldUpdateOperationsInput | string
    rules?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SocialFacilityUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    workingHours?: StringFieldUpdateOperationsInput | string
    rules?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SocialFacilityCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    workingHours?: SortOrder
    rules?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SocialFacilityAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type SocialFacilityMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    workingHours?: SortOrder
    rules?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SocialFacilityMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    workingHours?: SortOrder
    rules?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SocialFacilitySumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}