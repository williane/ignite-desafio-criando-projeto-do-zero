import { NextApiHandler } from 'next';
import url from 'url';

const exit: NextApiHandler = async (req, res) => {
  res.clearPreviewData();

  const queryObject = url.parse(req.url, true).query;
  const redirectUrl =
    queryObject && queryObject.currentUrl ? queryObject.currentUrl : '/';

  res.writeHead(307, { Location: redirectUrl });
  res.end();
};

export default exit;
