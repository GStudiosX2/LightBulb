# How to use this ?
Copy and paste the `.env.example` and name it `.env`.

Now you fill in the `token` you get from `glass.santio.me` should look like this:
```
# The socket the standalone connects to.
base_url = "wss://glassapi.santio.me/"

# The token used to identify your server and is provided by the website.
token    = "3bc2e..."
```

To specify which directory the file manager should start from you do `yarn dist --start_dir=...`
(If you dont specify a directory it will be `process.cwd()` by default)

# Learn More:
`yarn dist --help`

Now you can manage files on your computer or vps/dedicated server from `glass.santio.me`.