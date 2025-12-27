/// A sealed class representing the outcome of an operation.
///
/// It can be either [Ok] containing the data or [Err] containing an error message.
/// Usage of [sealed] enforces exhaustive pattern matching in switch statements.
sealed class Result<T> {
  const Result();
}

/// Represents a successful outcome containing the result data.
class Ok<T> extends Result<T> {
  final T data;
  const Ok(this.data);
}

/// Represents a failed outcome containing an error description.
class Err<T> extends Result<T> {
  final String message;
  const Err(this.message);
}