import { IoClose } from 'react-icons/io5';
import { isRecord } from '@/shared/validation';
import ossLicenses from '../data/ossLicenses.json';

interface LicenseDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

interface OssLicense {
  readonly name: string;
  readonly version: string;
  readonly license: string;
  readonly copyrights: readonly string[];
  readonly licenseText: string;
}

const isStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const parseOssLicense = (value: unknown): OssLicense | null => {
  if (!isRecord(value)) return null;
  if (
    typeof value.name !== 'string' ||
    typeof value.version !== 'string' ||
    typeof value.license !== 'string' ||
    !isStringArray(value.copyrights) ||
    typeof value.licenseText !== 'string'
  ) {
    return null;
  }
  return {
    name: value.name,
    version: value.version,
    license: value.license,
    copyrights: value.copyrights,
    licenseText: value.licenseText,
  };
};

const licenses: readonly OssLicense[] = Array.isArray(ossLicenses)
  ? ossLicenses.flatMap((item) => {
      const parsed = parseOssLicense(item);
      return parsed ? [parsed] : [];
    })
  : [];

/** 生成済み OSS ライセンス一覧を表示するダイアログ。 */
export const LicenseDialog = ({ open, onClose }: LicenseDialogProps): React.JSX.Element | null => {
  if (!open) return null;

  return (
    <div className="license-screen" role="dialog" aria-modal="true" aria-labelledby="license-title">
      <button
        type="button"
        className="license-screen__backdrop"
        aria-label="OSSライセンスを閉じる"
        onClick={onClose}
      />
      <section className="license-panel">
        <header className="license-panel__header">
          <button
            type="button"
            className="license-panel__close"
            aria-label="OSSライセンスを閉じる"
            onClick={onClose}
          >
            <IoClose aria-hidden />
          </button>
          <h2 id="license-title">OSSライセンス</h2>
          <span aria-hidden />
        </header>

        <div className="license-panel__body">
          <p className="license-panel__lead">
            このアプリケーションでは、以下のオープンソースソフトウェアを使用しています。
          </p>

          <div className="license-list">
            {licenses.map((item) => (
              <article className="license-item" key={`${item.name}-${item.version}`}>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.version}</p>
                </div>
                <dl>
                  <div>
                    <dt>License</dt>
                    <dd>{item.license}</dd>
                  </div>
                  <div>
                    <dt>Copyright</dt>
                    <dd>
                      {item.copyrights.length > 0
                        ? item.copyrights.map((copyright) => (
                            <span key={copyright}>{copyright}</span>
                          ))
                        : 'No copyright notice found in package license file.'}
                    </dd>
                  </div>
                </dl>
                <pre>{item.licenseText || 'No license file found in package.'}</pre>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
