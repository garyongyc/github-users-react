import React, { useState, useEffect, useContext } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  const [requestBalance, setRequestBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: '' });

  // (https://api.github.com/users/john-smilga/repos?per_page=100) - repos
  // (https://api.github.com/users/john-smilga/followers) - followers

  const searchGithubUser = async (user) => {
    toggleError();
    setIsLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    if (response) {
      setGithubUser(response.data);
      const { followers_url, repos_url } = response.data;
      await Promise.allSettled([
        axios(`${followers_url}?per_page=100`),
        axios(`${repos_url}?per_page=100`),
      ])
        .then((results) => {
          const [followers, repos] = results;
          if (followers.status === 'fulfilled') {
            setFollowers(followers.value.data);
          }
          if (repos.status === 'fulfilled') {
            setRepos(repos.value.data);
          }
        })
        .catch((err) => console.log(err));
    } else {
      toggleError(true, 'there is no user with this username');
    }
    fetchRequestBalance();
    setIsLoading(false);
  };

  const fetchRequestBalance = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data: { rate } }) => {
        let { remaining } = rate;
        setRequestBalance(remaining);
        if (remaining === 0) {
          toggleError(true, 'sorry, you have exceeded your hourly rate limit!');
        }
      })
      .catch((err) => console.log(err));
  };

  const toggleError = (show, msg) => {
    setError({ show, msg });
  };

  useEffect(() => {
    fetchRequestBalance();
  }, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requestBalance,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

const useGlobalContext = () => {
  return useContext(GithubContext);
};

export { GithubProvider, useGlobalContext };
