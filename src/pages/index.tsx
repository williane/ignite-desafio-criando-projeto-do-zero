import { GetStaticProps } from 'next';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import Prismic from '@prismicio/client';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  return (
    <>
      <Header />
      <div className={commonStyles.container}>
        {postsPagination.results.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a className={styles.post}>
              <h1 className={styles.title}>{post.data.title}</h1>
              <p className={styles.description}>{post.data.subtitle}</p>
              <div className={styles.grid}>
                <div>
                  <FiCalendar /> <time>{post.first_publication_date}</time>
                </div>
                <div>
                  <FiUser /> <span>{post.data.author}</span>
                </div>
              </div>
            </a>
          </Link>
        ))}
        {postsPagination.next_page ? (
          <a className={styles.link}>Carregar mais posts</a>
        ) : null}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: [],
      pageSize: 10,
    }
  );

  // console.log(postsResponse.results[0].data);

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy'
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  // TODO
  return {
    props: {
      postsPagination,
    },
  };
};
