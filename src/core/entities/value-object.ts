export abstract class ValueObject<T> {
  protected props: T;

  protected constructor(props: T) {
    this.props = props;
  }

  public equals(other: ValueObject<unknown>): boolean {
    if (other === null || other === undefined) return false;
    if (other.props === undefined) return false;

    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
